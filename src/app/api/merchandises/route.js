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
                        .whereRaw("LOWER(item_code) LIKE ?", [term])
                        .orWhereRaw("LOWER(name) LIKE ?", [term])
                        .orWhereRaw("LOWER(shelf_location) LIKE ?", [term]);
                });
            }
            return qb;
        };

        const baseQuery = applyFilters(db("merchandises"));
        const countQuery = applyFilters(db("merchandises"));

        const [{ count }] = await countQuery.count({ count: "*" });
        const total = Number(count);

        const merchandises = await baseQuery
            .select("*")
            .orderBy("id")
            .limit(limit)
            .offset(offset);

        return NextResponse.json({
            data: merchandises,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { itemCode, name, selfLocation, quantity, location, email } = body;

        if (!itemCode || itemCode.trim() === "") {
            return NextResponse.json({ error: "Product Code is required" }, { status: 400 });
        }
        if (!name || name.trim() === "") {
            return NextResponse.json({ error: "Product name is required" }, { status: 400 });
        }
        if (!selfLocation || selfLocation.trim() === "") {
            return NextResponse.json({ error: "Self Location is required" }, { status: 400 });
        }
        if (quantity === undefined || quantity === null || quantity === "") {
            return NextResponse.json({ error: "Quantity is required" }, { status: 400 });
        }
        if (!location) {
            return NextResponse.json({ error: "Location is required" }, { status: 400 });
        }

        const [id] = await db("merchandises").insert({
            item_code: itemCode.trim(),
            name: name.trim(),
            shelf_location: selfLocation.trim(),
            quantity: quantity.toString().trim(),
            location: location.toString(),
        });

        const newMerchandise = await db("merchandises").where({ id }).first();

        const locationRow = await db("locations").where({ id: newMerchandise.location }).first();
        const locationName = locationRow?.name || newMerchandise.location;

        await logActivity({
            email: email || "unknown",
            action: "Merchandise Created",
            comment: `Created "${newMerchandise.name}" (code: ${newMerchandise.item_code}) — qty: ${newMerchandise.quantity}, shelf: ${newMerchandise.shelf_location}, location: ${locationName}`,
            locationId: newMerchandise.location,
        });

        return NextResponse.json(newMerchandise, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
    }
}