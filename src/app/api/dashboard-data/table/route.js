import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productType = searchParams.get("productType") || null;
    const locationId = searchParams.get("locationId") || null;
    const divisionId = searchParams.get("divisionId") || null;
    const productCode = searchParams.get("productCode") || null;
    const startDate = searchParams.get("startDate") || null; // 'YYYY-MM-DD'
    const endDate = searchParams.get("endDate") || null; // 'YYYY-MM-DD'

    let query = db("dashboard_data as dd")
      .leftJoin("merchandises as m", "dd.product_code", "m.item_code")
      .leftJoin("locations as l", "dd.location_id", "l.id")
      .leftJoin("divisions as div", "dd.division_id", "div.id")
      .select(
        "dd.product_code",
        "m.name as product_name",
        "l.name as location_name",
        "div.name as division_name",
      )
      .sum({ added_qty: "dd.added_qty" })
      .sum({ removed_qty: "dd.removed_qty" })
      .groupBy("dd.product_code", "m.name", "l.name", "div.name")
      .orderBy("added_qty", "desc");

    if (productType) query = query.where("dd.product_type", productType);
    if (locationId) {
      query = query.whereRaw("TRIM(dd.location_id) = TRIM(?)", [locationId]);
    }
    if (divisionId) {
      query = query.whereRaw("TRIM(dd.division_id) = TRIM(?)", [divisionId]);
    }
    if (productCode) {
      query = query.whereRaw("LOWER(TRIM(dd.product_code)) = LOWER(TRIM(?))", [productCode]);
    }
    if (startDate) {
      query = query.where("dd.created_at", ">=", `${startDate} 00:00:00`);
    }
    if (endDate) {
      query = query.where("dd.created_at", "<=", `${endDate} 23:59:59`);
    }

    const rows = await query;

    const data = rows.map((r, index) => ({
      id: index + 1,
      productCode: r.product_code,
      name: r.product_name || "—",
      addedQty: Number(r.added_qty) || 0,
      removedQty: Number(r.removed_qty) || 0,
      location: r.location_name || "—",
      division: r.division_name || "—",
    }));

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard table data" },
      { status: 500 },
    );
  }
}