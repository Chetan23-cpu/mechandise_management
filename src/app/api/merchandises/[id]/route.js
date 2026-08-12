import db from '@/lib/db'
import { NextResponse } from 'next/server'
import { logActivity } from "@/lib/logActivity";

export async function PUT(request, { params }) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "Product id is required" }, { status: 400 });
        }

        const body = await request.json();
        const { itemCode, name, shelfLocation, quantity, reason, email } = body;

        if (!itemCode || itemCode.trim() === "") {
            return NextResponse.json({ error: "Item Code is required" }, { status: 400 });
        }
        if (!name || name.trim() === "") {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }
        if (!shelfLocation || shelfLocation.trim() === "") {
            return NextResponse.json({ error: "Shelf location is required" }, { status: 400 });
        }
        if (!quantity || quantity.toString().trim() === "") {
            return NextResponse.json({ error: "Quantity is required" }, { status: 400 });
        }
        if (!reason || reason.trim() === "") {
            return NextResponse.json({ error: "Reason is required" }, { status: 400 });
        }

        const existingProduct = await db("merchandises").where({ id }).first();
        if (!existingProduct) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        const parsedQuantity = Number(quantity);
        if (Number.isNaN(parsedQuantity)) {
            return NextResponse.json({ error: "Quantity must be a number" }, { status: 400 });
        }

        const updatePayload = {
            item_code: itemCode.trim(),
            name: name.trim(),
            shelf_location: shelfLocation.trim(),
            quantity: parsedQuantity,
        };

        await db("merchandises").where({ id }).update(updatePayload);

        const updatedMerchandise = await db("merchandises").where({ id }).first();

        // Resolve human-readable location name
        const locationRow = await db("locations")
            .where({ id: existingProduct.location })
            .first();
        const locationName = locationRow?.name || existingProduct.location;

        // Build a diff — only include fields that actually changed,
        // except shelf location and location which are always shown.
        const changes = [];

        if (existingProduct.item_code !== updatedMerchandise.item_code) {
            changes.push(`code: ${existingProduct.item_code} → ${updatedMerchandise.item_code}`);
        }
        if (existingProduct.name !== updatedMerchandise.name) {
            changes.push(`name: ${existingProduct.name} → ${updatedMerchandise.name}`);
        }
        if (existingProduct.quantity !== updatedMerchandise.quantity) {
            changes.push(`qty: ${existingProduct.quantity} → ${updatedMerchandise.quantity}`);
        }
        // always show shelf location, changed or not
        changes.push(`shelf: ${existingProduct.shelf_location} → ${updatedMerchandise.shelf_location}`);
        // always show location
        changes.push(`location: ${locationName}`);

        const changesText = changes.length > 0 ? ` — ${changes.join(", ")}` : "";

        await logActivity({
            email: email || "unknown",
            action: "Merchandise Updated",
            comment: `Updated "${existingProduct.name}" (code: ${existingProduct.item_code})${changesText}. Reason: ${reason.trim()}`,
            locationId: existingProduct.location,
        });

        return NextResponse.json(updatedMerchandise, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to update merchandise" },
            { status: 500 }
        );
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "Product id is required" }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const email = searchParams.get("email");

        const existingMerchandise = await db("merchandises").where({ id }).first();
        if (!existingMerchandise) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        // Resolve human-readable location name before the row is gone
        const locationRow = await db("locations")
            .where({ id: existingMerchandise.location })
            .first();
        const locationName = locationRow?.name || existingMerchandise.location;

        await db("merchandises").where({ id }).del();

        await logActivity({
            email: email || "unknown",
            action: "Merchandise Deleted",
            comment: `Deleted "${existingMerchandise.name}" (code: ${existingMerchandise.item_code}) — ` +
                `last known qty: ${existingMerchandise.quantity}, shelf: ${existingMerchandise.shelf_location}, location: ${locationName}`,
            locationId: existingMerchandise.location,
        });

        return NextResponse.json({ message: "Product deleted" }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to delete product" },
            { status: 500 }
        );
    }
}