import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "monthly";
    const productType = searchParams.get("productType") || null;
    const locationId = searchParams.get("locationId") || null;
    const divisionId = searchParams.get("divisionId") || null;
    const productCode = searchParams.get("productCode") || null;

    let query = db("dashboard_data");
    if (productType) query = query.where({ product_type: productType });
    if (locationId) {
      query = query.whereRaw("TRIM(location_id) = TRIM(?)", [locationId]);
    }
    if (divisionId) {
      query = query.whereRaw("TRIM(division_id) = TRIM(?)", [divisionId]);
    }
    if (productCode) {
      query = query.whereRaw("LOWER(TRIM(product_code)) = LOWER(TRIM(?))", [productCode]);
    }

    let rows;

    if (period === "quarterly") {
      rows = await query
        .select(
          db.raw("CONCAT(YEAR(created_at), '-Q', QUARTER(created_at)) as period_label"),
          db.raw("SUM(added_qty) as added_qty"),
          db.raw("SUM(removed_qty) as removed_qty"),
        )
        .groupByRaw("YEAR(created_at), QUARTER(created_at)")
        .orderByRaw("YEAR(created_at), QUARTER(created_at)");
      rows = rows.slice(-8);
    } else if (period === "yearly") {
      rows = await query
        .select(
          db.raw("YEAR(created_at) as period_label"),
          db.raw("SUM(added_qty) as added_qty"),
          db.raw("SUM(removed_qty) as removed_qty"),
        )
        .groupByRaw("YEAR(created_at)")
        .orderByRaw("YEAR(created_at)");
      rows = rows.slice(-5);
    } else {
      rows = await query
        .select(
          db.raw("DATE_FORMAT(created_at, '%Y-%m') as period_label"),
          db.raw("SUM(added_qty) as added_qty"),
          db.raw("SUM(removed_qty) as removed_qty"),
        )
        .groupByRaw("DATE_FORMAT(created_at, '%Y-%m')")
        .orderByRaw("DATE_FORMAT(created_at, '%Y-%m')");
      rows = rows.slice(-12);
    }

    const data = rows.map((r) => ({
      label: String(r.period_label),
      added_qty: Number(r.added_qty) || 0,
      removed_qty: Number(r.removed_qty) || 0,
    }));

    return NextResponse.json({ period, data }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 },
    );
  }
}