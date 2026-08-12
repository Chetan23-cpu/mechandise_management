import db from "@/lib/db";
import { NextResponse } from "next/server";
import { logActivity } from "@/lib/logActivity";

export async function PUT(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Asset id is required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { itemCode, name, shelfLocation, reason, email } = body;

    if (!itemCode || itemCode.trim() === "") {
      return NextResponse.json(
        { error: "Item Code is required" },
        { status: 400 },
      );
    }
    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!shelfLocation || shelfLocation.trim() === "") {
      return NextResponse.json(
        { error: "Shelf location is required" },
        { status: 400 },
      );
    }
    if (!reason || reason.trim() === "") {
      return NextResponse.json(
        { error: "Reason is required" },
        { status: 400 },
      );
    }

    const existingAsset = await db("reusables").where({ id }).first();
    if (!existingAsset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const updatePayload = {
      itemCode: itemCode.trim(),
      name: name.trim(),
      shelf_location: shelfLocation.trim(),
      
    };

    await db("reusables").where({ id }).update(updatePayload);

    const updatedAsset = await db("reusables").where({ id }).first();


    const locationRow = await db("locations")
      .where({ id: existingAsset.location })
      .first();
    const locationName = locationRow?.name || existingAsset.location;

    const changes = [];

    if (existingAsset.itemCode !== updatePayload.itemCode) {
      changes.push(`code: ${existingAsset.itemCode} → ${updatePayload.itemCode}`);
    }
    if (existingAsset.name !== updatePayload.name) {
      changes.push(`name: ${existingAsset.name} → ${updatePayload.name}`);
    }
    changes.push(
      `shelf: ${existingAsset.shelf_location} → ${updatePayload.shelf_location}`,
    );

    changes.push(`location: ${locationName}`);

    const changesText = changes.length > 0 ? ` — ${changes.join(", ")}` : "";

    await logActivity({
      email,
      action: "Reusable Product Updated",
      comment: `Updated "${updatedAsset.name}" (code: ${updatedAsset.itemCode})${changesText}. Reason: ${reason.trim()}`,
      locationId: existingAsset.location,
    });

    return NextResponse.json(updatedAsset, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update reusable asset" },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Asset id is required" },
        { status: 400 },
      );
    }

    const existingAsset = await db("reusables").where({ id }).first();
    if (!existingAsset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    // Resolve location name BEFORE deleting the row
    const locationRow = await db("locations")
      .where({ id: existingAsset.location })
      .first();
    const locationName = locationRow?.name || existingAsset.location;

    await db("reusables").where({ id }).del();

    await logActivity({
      email: email || "unknown",
      action: "Reusable Product Deleted",
      comment: `Deleted "${existingAsset.name}" (code: ${existingAsset.itemCode}) — ` +
        `shelf: ${existingAsset.shelf_location}, location: ${locationName}`,
      locationId: existingAsset.location,
    });

    return NextResponse.json({ message: "Asset deleted" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete reusable asset" },
      { status: 500 },
    );
  }
}
