import db from '@/lib/db'
import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { logActivity } from "@/lib/logActivity";
import { requireAdmin } from "@/lib/authGuard";

export async function GET(request) {
    const guard = await requireAdmin();
    if (guard) return guard;

    try {
        const { searchParams } = new URL(request.url);
        const locationId = searchParams.get("locationId");

        let query = db("users")
            .select(
                "id",
                "name",
                "email",
                "isAdmin",
                "location"
            )
            .orderBy("id");

        const users = await query;

        const parsedUsers = users.map((u) => ({
            ...u,
            location: typeof u.location === "string" ? JSON.parse(u.location) : u.location,
        }));

        const filtered = locationId
            ? parsedUsers.filter((u) => Array.isArray(u.location) && u.location.includes(Number(locationId)))
            : parsedUsers;

        return NextResponse.json(filtered);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    const guard = await requireAdmin();
    if (guard) return guard;

    try {
        const body = await request.json();
        const { name, email, password, location, isAdmin, actorEmail } = body;

        if (!name || name.trim() === "") {
            return NextResponse.json({ error: "Username is required" }, { status: 400 });
        }
        if (!email || email.trim() === "") {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }
        if (!password || password.trim() === "") {
            return NextResponse.json({ error: "Password is required" }, { status: 400 });
        }
        if (!isAdmin || isAdmin.trim() === "") {
            return NextResponse.json({ error: "Status is required" }, { status: 400 });
        }
        if (!Array.isArray(location) || location.length === 0) {
            return NextResponse.json({ error: "At least one location is required" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [id] = await db("users").insert({
            name: name.trim(),
            email: email.trim(),
            password: hashedPassword,
            isAdmin: isAdmin.trim(),
            location: JSON.stringify(location),
        });

        const newUser = await db("users").where({ id }).first();
        const { password: _pw, ...safeUser } = newUser;
        safeUser.location = typeof safeUser.location === "string"
            ? JSON.parse(safeUser.location)
            : safeUser.location;

        await logActivity({
            email: actorEmail || "unknown",
            action: "User Added",
            comment: `Added user "${safeUser.name}" (${safeUser.email}), admin: ${safeUser.isAdmin}`,
            locationId: null,
        });

        return NextResponse.json(safeUser, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }
}
