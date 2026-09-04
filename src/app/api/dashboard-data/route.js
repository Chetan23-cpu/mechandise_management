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

    const currentYear = new Date().getFullYear();

    let query = db("dashboard_data as dd");
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

    // Monthly and quarterly are scoped to the current calendar year.
    // Yearly shows every year on record, so no year filter is applied there.
    if (period === "monthly" || period === "quarterly") {
      query = query.whereRaw("YEAR(dd.created_at) = ?", [currentYear]);
    }

    let rows;

    if (period === "quarterly") {
      rows = await query
        .select(
          db.raw("YEAR(dd.created_at) as yr"),
          db.raw("QUARTER(dd.created_at) as qtr"),
          db.raw("SUM(dd.added_qty) as added_qty"),
          db.raw("SUM(dd.removed_qty) as removed_qty"),
        )
        .groupByRaw("YEAR(dd.created_at), QUARTER(dd.created_at)")
        .orderByRaw("YEAR(dd.created_at), QUARTER(dd.created_at)");
    } else if (period === "yearly") {
      rows = await query
        .select(
          db.raw("YEAR(dd.created_at) as period_label"),
          db.raw("SUM(dd.added_qty) as added_qty"),
          db.raw("SUM(dd.removed_qty) as removed_qty"),
        )
        .groupByRaw("YEAR(dd.created_at)")
        .orderByRaw("YEAR(dd.created_at)");
    } else {
      // monthly
      rows = await query
        .select(
          db.raw("DATE_FORMAT(dd.created_at, '%Y-%m') as period_label"),
          db.raw("SUM(dd.added_qty) as added_qty"),
          db.raw("SUM(dd.removed_qty) as removed_qty"),
        )
        .groupByRaw("DATE_FORMAT(dd.created_at, '%Y-%m')")
        .orderByRaw("DATE_FORMAT(dd.created_at, '%Y-%m')");
    }

    const data = rows.map((r) => ({
      label:
        period === "quarterly"
          ? `${r.yr}-Q${r.qtr}`
          : String(r.period_label),
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