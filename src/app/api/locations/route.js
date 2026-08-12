import db from "@/lib/db";
import { NextResponse } from "next/server";
import { logActivity } from "@/lib/logActivity";

export async function GET() {
    try {
        const locations = await db("locations").select("*").orderBy("id");
        return NextResponse.json(locations);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch locations"}, { status: 500})
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, email } = body;

        if (!name || name.trim() === ""){
            return NextResponse.json({ error: "Location name is required"}, {status: 400});
        }

        const [id] = await db("locations").insert({
            name: name.trim(),
        });

        const newLocation = await db("locations").where( { id }).first();

        await logActivity({
            email: email || "unknown",
            action: "Location Added",
            comment: `Added location "${newLocation.name}"`,
            locationId: newLocation.id,
        });

        return NextResponse.json(newLocation, { status: 201})
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create location"}, { status: 500});
    }
}