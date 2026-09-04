import db from "@/lib/db";
import { NextResponse } from "next/server";
import { logActivity } from "@/lib/logActivity";

export async function GET() {
    try {
        const locations = await db("locations").select("*").orderBy("id");

        const parsed = locations.map((loc) => ({
            ...loc,
            divisions: Array.isArray(loc.divisions)
                ? loc.divisions
                : loc.divisions
                    ? JSON.parse(loc.divisions)
                    : [],
        }));

        return NextResponse.json(parsed);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch locations"}, { status: 500})
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, email, divisions } = body;

        if (!name || name.trim() === ""){
            return NextResponse.json({ error: "Location name is required"}, {status: 400});
        }

        const divisionIds = Array.isArray(divisions) ? divisions : [];

        const [id] = await db("locations").insert({
            name: name.trim(),
            divisions: JSON.stringify(divisionIds),
        });

        const newLocation = await db("locations").where( { id }).first();

        await logActivity({
            email: email || "unknown",
            action: "Location Added",
            comment: `Added location "${newLocation.name}"`,
            locationId: newLocation.id,
        });

        return NextResponse.json(
            {
                ...newLocation,
                divisions: Array.isArray(newLocation.divisions)
                    ? newLocation.divisions
                    : newLocation.divisions
                        ? JSON.parse(newLocation.divisions)
                        : [],
            },
            { status: 201 },
        );
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create location"}, { status: 500});
    }
}