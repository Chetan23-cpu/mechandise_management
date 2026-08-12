import db from "@/lib/db";
import { NextResponse } from "next/server";
import { logActivity } from "@/lib/logActivity";

export async function PATCH(request, { params }) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "Asset id is required" }, { status: 400 });
        }

        const body = await request.json();
        const { shelfLocation, reason, email } = body;

        if (!shelfLocation || shelfLocation.trim() === "") {
            return NextResponse.json({ error: "Shelf location is required" }, { status: 400 });
        }

        const existingAsset = await db("reusables").where({ id }).first();
        if (!existingAsset) {
            return NextResponse.json({ error: "Asset not found" }, { status: 404 });
        }

        await db("reusables").where({ id }).update({
            shelf_location: shelfLocation.trim(),
            status: "store",
        });

        const updatedAsset = await db("reusables").where({ id }).first();

        await logActivity({
            email,
            action: "Reusable Product Checked In",
            comment: `${updatedAsset.name} (${updatedAsset.itemCode}) checked in to shelf ${updatedAsset.shelf_location}${reason ? `. Reason: ${reason}` : ""}`,
            locationId: existingAsset.location,
        });

        return NextResponse.json(updatedAsset, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to check in reusable asset" },
            { status: 500 }
        );
    }
}