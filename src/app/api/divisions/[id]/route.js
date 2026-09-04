import db from "@/lib/db";
import { NextResponse } from "next/server";
import { logActivity } from "@/lib/logActivity";

export async function PUT(request, { params }) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "Division id is required" }, { status: 400 });
        }

        const body = await request.json();
        const { name, email, remarks } = body;

        if (!name || name.trim() === "") {
            return NextResponse.json({ error: "Division name is required" }, { status: 400 });
        }

        if (!remarks || remarks.trim() === "") {
            return NextResponse.json({ error: "Reason for change is required" }, { status: 400 });
        }

        const existingDivision = await db("divisions").where({ id }).first();
        if (!existingDivision) {
            return NextResponse.json({ error: "Division not found" }, { status: 404 });
        }

        const updatePayload = {
            name: name.trim(),
        };

        await db("divisions").where({ id }).update(updatePayload);

        const updatedDivision = await db("divisions").where({ id }).first();

        const changes = [];
        if (existingDivision.name !== updatedDivision.name) {
            changes.push(`name: ${existingDivision.name} → ${updatedDivision.name}`);
        }
        const changesText = changes.length > 0 ? ` — ${changes.join(", ")}` : "";

        await logActivity({
            email: email || "unknown",
            action: "Division Updated",
            comment: `Updated division "${existingDivision.name}"${changesText}. Reason: ${remarks.trim()}`,
            divisionId: updatedDivision.id,
        });

        return NextResponse.json(updatedDivision, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to update division" }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "Division id is required" }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const email = searchParams.get("email");

        const existingDivision = await db("divisions").where({ id }).first();
        if (!existingDivision) {
            return NextResponse.json({ error: "Division not found" }, { status: 404 });
        }

        await db("divisions").where({ id }).del();

        await logActivity({
            email: email || "unknown",
            action: "Division Deleted",
            comment: `Deleted division "${existingDivision.name}"`,
            divisionId: existingDivision.id,
        });

        return NextResponse.json({ message: "Division deleted" }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to delete division" }, { status: 500 });
    }
}