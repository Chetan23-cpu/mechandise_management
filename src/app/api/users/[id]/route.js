import db from '@/lib/db'
import { NextResponse } from 'next/server'
import { logActivity } from "@/lib/logActivity";
import bcrypt from "bcrypt";

export async function PUT(request, { params }) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "User id is required" }, { status: 400 });
        }

        const body = await request.json();
        const { name, email, location, isAdmin, reason, password, actorEmail } = body;

        if (!name || name.trim() === "") {
            return NextResponse.json({ error: "Username is required" }, { status: 400 });
        }
        if (!email || email.trim() === "") {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }
        if (!Array.isArray(location) || location.length === 0) {
            return NextResponse.json({ error: "At least one location is required" }, { status: 400 });
        }
        if (!reason || reason.toString().trim() === "") {
            return NextResponse.json({ error: "Reason is required" }, { status: 400 });
        }
        if (password !== undefined && password.trim().length < 6) {
            return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
        }

        const existingUser = await db("users").where({ id }).first();
        if (!existingUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const updatePayload = {
            name: name.trim(),
            email: email.trim(),
            location: JSON.stringify(location),
        };

        if (typeof isAdmin !== "undefined") {
            updatePayload.isAdmin = isAdmin.trim();
        }

        if (password && password.trim() !== "") {
            updatePayload.password = await bcrypt.hash(password.trim(), 10);
        }

        await db("users").where({ id }).update(updatePayload);

        const updatedUser = await db("users").where({ id }).first();
        delete updatedUser.password;

        await logActivity({
            email: actorEmail || "unknown",
            action: "User Updated",
            comment: `Updated user "${updatedUser.name}" (${updatedUser.email})${password ? " (password changed)" : ""}. Reason: ${reason.trim()}`,
            locationId: null,
        });

        return NextResponse.json(updatedUser, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to update user" },
            { status: 500 }
        );
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "User id is required" }, { status: 400 });
        }

        const existingUser = await db("users").where({ id }).first();
        if (!existingUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const actorEmail = searchParams.get("email");

        await db("users").where({ id }).del();

        await logActivity({
            email: actorEmail || "unknown",
            action: "User Deleted",
            comment: `Deleted user "${existingUser.name}" (${existingUser.email})`,
            locationId: null,
        });

        return NextResponse.json({ message: "User deleted" }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to delete user" },
            { status: 500 }
        );
    }
}