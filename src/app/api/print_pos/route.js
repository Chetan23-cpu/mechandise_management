import db from "@/lib/db";
import { NextResponse } from "next/server";
import { logActivity } from "@/lib/logActivity";

const MAX_IMAGE_BYTES = 200 * 1024; // 200KB, measured on the original file (pre base64)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = (page - 1) * limit;

    const applyFilters = (qb) => {
      if (locationId) {
        qb = qb.where({ location: locationId });
      }
      if (search && search.trim() !== "") {
        const term = `%${search.trim().toLowerCase()}%`;
        qb = qb.where((builder) => {
          builder
            .whereRaw("LOWER(item_code) LIKE ?", [term])
            .orWhereRaw("LOWER(name) LIKE ?", [term])
            .orWhereRaw("LOWER(shelf) LIKE ?", [term]);
        });
      }
      return qb;
    };

    const baseQuery = applyFilters(db("print_pos"));
    const countQuery = applyFilters(db("print_pos"));

    const [{ count }] = await countQuery.count({ count: "*" });
    const total = Number(count);

    const printPosItems = await baseQuery
      .select("*")
      .orderBy("id")
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data: printPosItems,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      itemCode,
      name,
      selfLocation,
      quantity,
      minquantity,
      location,
      divisionId,
      email,
      image,
    } = body;

    if (!itemCode || itemCode.trim() === "") {
      return NextResponse.json(
        { error: "Product Code is required" },
        { status: 400 },
      );
    }
    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 },
      );
    }
    if (!selfLocation || selfLocation.trim() === "") {
      return NextResponse.json(
        { error: "Self Location is required" },
        { status: 400 },
      );
    }
    if (quantity === undefined || quantity === null || quantity === "") {
      return NextResponse.json(
        { error: "Quantity is required" },
        { status: 400 },
      );
    }
    if (!location) {
      return NextResponse.json(
        { error: "Location is required" },
        { status: 400 },
      );
    }
    if (
      minquantity === undefined ||
      minquantity === null ||
      minquantity === ""
    ) {
      return NextResponse.json(
        { error: "Min Quantity is required" },
        { status: 400 },
      );
    }
    if (!divisionId) {
      return NextResponse.json(
        { error: "Division is required" },
        { status: 400 },
      );
    }

    // image is an optional base64 data URL, e.g. "data:image/png;base64,...."
    let imageToStore = null;
    if (image && typeof image === "string" && image.trim() !== "") {
      const base64Part = image.includes(",") ? image.split(",")[1] : image;
      const approxBytes = Math.ceil((base64Part.length * 3) / 4);

      if (approxBytes > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { error: "Image must be smaller than 200KB" },
          { status: 400 },
        );
      }

      imageToStore = image;
    }

    // Resolve user_id from the submitted email up front
    const userRow = email
      ? await db("users").where({ email }).first()
      : null;

    const newPrintPos = await db.transaction(async (trx) => {
      const [id] = await trx("print_pos").insert({
        item_code: itemCode.trim(),
        name: name.trim(),
        shelf: selfLocation.trim(),
        quantity: quantity.toString().trim(),
        minquantity: minquantity.toString().trim(),
        location: location.toString(),
        divisions: divisionId.toString(),
        image: imageToStore,
      });

      const printPos = await trx("print_pos").where({ id }).first();

      await trx("dashboard_data").insert({
        product_code: printPos.item_code,
        location_id: printPos.location,
        division_id: printPos.divisions,
        user_id: userRow ? userRow.id.toString() : null,
        added_qty: parseInt(printPos.quantity, 10) || 0,
        removed_qty: 0,
        product_type: "print_pos",
      });

      return printPos;
    });

    const locationRow = await db("locations")
      .where({ id: newPrintPos.location })
      .first();
    const locationName = locationRow?.name || newPrintPos.location;

    await logActivity({
      email: email || "unknown",
      action: "Print & POS Created",
      comment: `Created "${newPrintPos.name}" (code: ${newPrintPos.item_code}) — qty: ${newPrintPos.quantity}, shelf: ${newPrintPos.shelf}, location: ${locationName}`,
      locationId: newPrintPos.location,
    });

    return NextResponse.json(newPrintPos, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 },
    );
  }
}
