import db from "@/lib/db";
import { NextResponse } from "next/server";
import { logActivity } from "@/lib/logActivity";

export async function PUT(request, { params }) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "Location id is required" }, { status: 400 });
        }

        const body = await request.json();
        const { name, email, remarks } = body;

        if (!name || name.trim() === "") {
            return NextResponse.json({ error: "Location name is required" }, { status: 400 });
        }

        const existingLocation = await db("locations").where({ id }).first();
        if (!existingLocation) {
            return NextResponse.json({ error: "Location not found" }, { status: 404 });
        }

        const updatePayload = {
            name: name.trim(),
        };

        await db("locations").where({ id }).update(updatePayload);

        const updatedLocation = await db("locations").where({ id }).first();

        const changes = [];
        if (existingLocation.name !== updatedLocation.name) {
            changes.push(`name: ${existingLocation.name} → ${updatedLocation.name}`);
        }
        const changesText = changes.length > 0 ? ` — ${changes.join(", ")}` : "";
        const reasonText = remarks && remarks.trim() ? ` (reason: ${remarks.trim()})` : "";

        await logActivity({
            email: email || "unknown",
            action: "Location Updated",
            comment: `Updated location "${existingLocation.name}"${changesText}${reasonText}`,
            locationId: updatedLocation.id,
        });

        return NextResponse.json(updatedLocation, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to update location" }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "Location id is required" }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const email = searchParams.get("email");

        const existingLocation = await db("locations").where({ id }).first();
        if (!existingLocation) {
            return NextResponse.json({ error: "Location not found" }, { status: 404 });
        }

        await db("locations").where({ id }).del();

        await logActivity({
            email: email || "unknown",
            action: "Location Deleted",
            comment: `Deleted location "${existingLocation.name}"`,
            locationId: existingLocation.id,
        });

        return NextResponse.json({ message: "Location deleted" }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to delete location" }, { status: 500 });
    }
}
