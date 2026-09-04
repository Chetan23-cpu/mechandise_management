import db from "@/lib/db";
import { NextResponse } from "next/server";
import { logActivity } from "@/lib/logActivity";

const MAX_IMAGE_BYTES = 200 * 1024; // 200KB, measured on the original file (pre base64)

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
    const { itemCode, name, shelfLocation, divisionId, reason, email, image } = body;

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

    // divisionId is optional on update — only touch the column if the
    // caller explicitly sent the field (present, even if null/empty)
    if (Object.prototype.hasOwnProperty.call(body, "divisionId")) {
      updatePayload.divisions = divisionId ? divisionId.toString() : null;
    }

    // image handling:
    // - key absent from body  -> leave existing image untouched
    // - image === ""          -> clear the image
    // - image is a data URL   -> validate size and store it
    let imageChanged = false;
    if (Object.prototype.hasOwnProperty.call(body, "image")) {
      if (!image || image.trim() === "") {
        updatePayload.image = null;
        imageChanged = existingAsset.image !== null;
      } else {
        const base64Part = image.includes(",") ? image.split(",")[1] : image;
        const approxBytes = Math.ceil((base64Part.length * 3) / 4);

        if (approxBytes > MAX_IMAGE_BYTES) {
          return NextResponse.json(
            { error: "Image must be smaller than 200KB" },
            { status: 400 },
          );
        }

        updatePayload.image = image;
        imageChanged = existingAsset.image !== image;
      }
    }

    await db("reusables").where({ id }).update(updatePayload);

    const updatedAsset = await db("reusables").where({ id }).first();

    const locationRow = await db("locations")
      .where({ id: existingAsset.location })
      .first();
    const locationName = locationRow?.name || existingAsset.location;

    // Resolve human-readable division names (before/after) for the log
    const [existingDivisionRow, updatedDivisionRow] = await Promise.all([
      existingAsset.divisions
        ? db("divisions").where({ id: existingAsset.divisions }).first()
        : null,
      updatedAsset.divisions
        ? db("divisions").where({ id: updatedAsset.divisions }).first()
        : null,
    ]);
    const existingDivisionName = existingDivisionRow?.name || existingAsset.divisions || "—";
    const updatedDivisionName = updatedDivisionRow?.name || updatedAsset.divisions || "—";

    const changes = [];

    if (existingAsset.itemCode !== updatePayload.itemCode) {
      changes.push(`code: ${existingAsset.itemCode} → ${updatePayload.itemCode}`);
    }
    if (existingAsset.name !== updatePayload.name) {
      changes.push(`name: ${existingAsset.name} → ${updatePayload.name}`);
    }
    if (String(existingAsset.divisions || "") !== String(updatedAsset.divisions || "")) {
      changes.push(`division: ${existingDivisionName} → ${updatedDivisionName}`);
    }
    if (imageChanged) {
      changes.push(`image: ${updatedAsset.image ? "updated" : "removed"}`);
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