import db from "@/lib/db";
import { NextResponse } from "next/server";

function getDateRangeForPeriod(period) {
  const now = new Date();
  const year = now.getFullYear();

  if (period === "yearly") {
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);
    return { start, end };
  }

  if (period === "quarterly") {
    const currentQuarter = Math.floor(now.getMonth() / 3); // 0,1,2,3
    const startMonth = currentQuarter * 3;
    const start = new Date(year, startMonth, 1);
    const end = new Date(year, startMonth + 3, 1);
    return { start, end };
  }

  // monthly (default)
  const start = new Date(year, now.getMonth(), 1);
  const end = new Date(year, now.getMonth() + 1, 1);
  return { start, end };
}

const toSqlDateTime = (date) => date.toISOString().slice(0, 19).replace("T", " ");

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productType = searchParams.get("productType") || null;
    const period = searchParams.get("period") || "monthly";

    const { start, end } = getDateRangeForPeriod(period);
    const startSql = toSqlDateTime(start);
    const endSql = toSqlDateTime(end);

    const baseQuery = () => {
      let q = db("dashboard_data as dd")
        .where("dd.created_at", ">=", startSql)
        .where("dd.created_at", "<", endSql);
      if (productType) q = q.where("dd.product_type", productType);
      return q;
    };

    // Top location by total removed_qty
    const topLocationRow = await baseQuery()
      .leftJoin("locations as l", "dd.location_id", "l.id")
      .select("l.name as location_name", "dd.location_id")
      .sum({ total_removed: "dd.removed_qty" })
      .groupBy("dd.location_id", "l.name")
      .orderBy("total_removed", "desc")
      .first();

    // Top location + division combination by total removed_qty
    const topDivisionRow = await baseQuery()
      .leftJoin("locations as l", "dd.location_id", "l.id")
      .leftJoin("divisions as div", "dd.division_id", "div.id")
      .select(
        "l.name as location_name",
        "div.name as division_name",
        "dd.location_id",
        "dd.division_id",
      )
      .sum({ total_removed: "dd.removed_qty" })
      .groupBy("dd.location_id", "dd.division_id", "l.name", "div.name")
      .orderBy("total_removed", "desc")
      .first();

    // Top product by total removed_qty — resolve name from whichever
    // source table matches (merchandises or print_pos)
    const topProductRow = await baseQuery()
      .select("dd.product_code")
      .sum({ total_removed: "dd.removed_qty" })
      .groupBy("dd.product_code")
      .orderBy("total_removed", "desc")
      .first();

    let topProductName = null;
    if (topProductRow?.product_code) {
      const merchandiseMatch = await db("merchandises")
        .where({ item_code: topProductRow.product_code })
        .first();
      const printPosMatch = merchandiseMatch
        ? null
        : await db("print_pos")
            .where({ item_code: topProductRow.product_code })
            .first();

      topProductName =
        merchandiseMatch?.name || printPosMatch?.name || topProductRow.product_code;
    }

    return NextResponse.json(
      {
        period,
        topLocation: topLocationRow
          ? {
              name: topLocationRow.location_name || "—",
              totalRemoved: Number(topLocationRow.total_removed) || 0,
            }
          : null,
        topDivision: topDivisionRow
          ? {
              locationName: topDivisionRow.location_name || "—",
              divisionName: topDivisionRow.division_name || "—",
              totalRemoved: Number(topDivisionRow.total_removed) || 0,
            }
          : null,
        topProduct: topProductRow
          ? {
              productCode: topProductRow.product_code,
              name: topProductName,
              totalRemoved: Number(topProductRow.total_removed) || 0,
            }
          : null,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch top removed stats" },
      { status: 500 },
    );
  }
}