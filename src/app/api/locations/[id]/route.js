import db from "@/lib/db";
import { NextResponse } from "next/server";
import { logActivity } from "@/lib/logActivity";

const parseDivisions = (value) => {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    try {
        return JSON.parse(value);
    } catch {
        return [];
    }
};

export async function PUT(request, { params }) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "Location id is required" }, { status: 400 });
        }

        const body = await request.json();
        const { name, email, remarks, divisions } = body;

        if (!name || name.trim() === "") {
            return NextResponse.json({ error: "Location name is required" }, { status: 400 });
        }

        if (!remarks || remarks.trim() === "") {
            return NextResponse.json({ error: "Reason for change is required" }, { status: 400 });
        }

        const existingLocationRaw = await db("locations").where({ id }).first();
        if (!existingLocationRaw) {
            return NextResponse.json({ error: "Location not found" }, { status: 404 });
        }

        const existingLocation = {
            ...existingLocationRaw,
            divisions: parseDivisions(existingLocationRaw.divisions),
        };

        const divisionIds = Array.isArray(divisions)
            ? divisions
            : existingLocation.divisions;

        const updatePayload = {
            name: name.trim(),
            divisions: JSON.stringify(divisionIds),
        };

        await db("locations").where({ id }).update(updatePayload);

        const updatedLocationRaw = await db("locations").where({ id }).first();
        const updatedLocation = {
            ...updatedLocationRaw,
            divisions: parseDivisions(updatedLocationRaw.divisions),
        };

        const changes = [];
        if (existingLocation.name !== updatedLocation.name) {
            changes.push(`name: ${existingLocation.name} → ${updatedLocation.name}`);
        }

        const existingIds = existingLocation.divisions.map(String);
        const updatedIds = updatedLocation.divisions.map(String);

        const addedIds = updatedIds.filter((d) => !existingIds.includes(d));
        const removedIds = existingIds.filter((d) => !updatedIds.includes(d));

        if (addedIds.length > 0 || removedIds.length > 0) {
            const allDivisionRows = await db("divisions").whereIn(
                "id",
                [...addedIds, ...removedIds],
            );
            const divisionNameById = new Map(
                allDivisionRows.map((d) => [String(d.id), d.name]),
            );

            const addedNames = addedIds.map((d) => divisionNameById.get(d) || d);
            const removedNames = removedIds.map((d) => divisionNameById.get(d) || d);

            const divisionChangeParts = [];
            if (addedNames.length > 0) {
                divisionChangeParts.push(`added: ${addedNames.join(", ")}`);
            }
            if (removedNames.length > 0) {
                divisionChangeParts.push(`removed: ${removedNames.join(", ")}`);
            }

            changes.push(`divisions (${divisionChangeParts.join("; ")})`);
        }

        const changesText = changes.length > 0 ? ` — ${changes.join(", ")}` : "";

        await logActivity({
            email: email || "unknown",
            action: "Location Updated",
            comment: `Updated location "${existingLocation.name}"${changesText}. Reason: ${remarks.trim()}`,
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