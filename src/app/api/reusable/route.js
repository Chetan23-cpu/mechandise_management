import db from "@/lib/db";
import { NextResponse } from "next/server";
import { logActivity } from "@/lib/logActivity";

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
            .whereRaw("LOWER(itemCode) LIKE ?", [term])
            .orWhereRaw("LOWER(name) LIKE ?", [term])
            .orWhereRaw("LOWER(status) LIKE ?", [term])
            .orWhereRaw("LOWER(shelf_location) LIKE ?", [term]);
        });
      }
      return qb;
    };

    const baseQuery = applyFilters(db("reusables"));
    const countQuery = applyFilters(db("reusables"));

    const [{ count }] = await countQuery.count({ count: "*" });
    const total = Number(count);

    const reusables = await baseQuery
      .select("*")
      .orderBy("id")
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data: reusables,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch reusable products" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { itemCode, name, selfLocation, status, location, email } = body;

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
    if (status === undefined || status === null || status === "") {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 },
      );
    }
    if (!location) {
      return NextResponse.json(
        { error: "Location is required" },
        { status: 400 },
      );
    }

    const [id] = await db("reusables").insert({
      itemCode: itemCode.trim(),
      name: name.trim(),
      shelf_location: selfLocation.trim(),
      status: status.toString().trim(),
      location: location.toString(),
    });

    const newReusable = await db("reusables").where({ id }).first();

    const locationRow = await db("locations").where({ id: newReusable.location }).first();
    const locationName = locationRow?.name || newReusable.location;

    await logActivity({
      email: email || "unknown",
      action: "Reusable Product Added",
      comment: `${newReusable.name} (${newReusable.itemCode}) added to shelf ${newReusable.shelf_location}, location: ${locationName}`,
      locationId: location,
    });

    return NextResponse.json(newReusable, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create reusable product" },
      { status: 500 },
    );
  }
}