import db from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const locationId = searchParams.get("locationId");
        const search = searchParams.get("search");
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "10", 10);
        const offset = (page - 1) * limit;

        const buildQuery = () => {
            let qb = db("request_items as ri")
                .join("requests as r", "ri.request_id", "r.id")
                .leftJoin("merchandises as m", function () {
                    this.on("ri.product_id", "=", "m.id").andOnVal("ri.type", "=", "merchandise");
                })
                .leftJoin("reusables as re", function () {
                    this.on("ri.product_id", "=", "re.id").andOnVal("ri.type", "=", "reusable");
                });

            if (locationId) {
                qb = qb.where("r.location", locationId);
            }

            if (search && search.trim() !== "") {
                const term = `%${search.trim().toLowerCase()}%`;
                qb = qb.where((builder) => {
                    builder
                        .whereRaw("LOWER(r.request_no) LIKE ?", [term])
                        .orWhereRaw("LOWER(r.name) LIKE ?", [term])
                        .orWhereRaw("LOWER(r.requested_to) LIKE ?", [term])
                        .orWhereRaw("LOWER(ri.type) LIKE ?", [term])
                        .orWhereRaw("LOWER(ri.status) LIKE ?", [term])
                        .orWhereRaw("LOWER(COALESCE(m.name, re.name)) LIKE ?", [term]);
                });
            }

            return qb;
        };

        const countRow = await buildQuery().count({ count: "ri.id" }).first();
        const total = Number(countRow.count);

        const items = await buildQuery()
            .select(
                "ri.id as item_id",
                "ri.type",
                "ri.product_id",
                "ri.quantity",
                "ri.status",
                "r.request_no",
                "r.name",
                "r.requested_to",
                "r.created_at as date",
                db.raw("COALESCE(m.name, re.name) as item_name"),
                "m.quantity as merch_quantity",
                "re.status as reusable_status"
            )
            .orderBy("r.created_at", "desc")
            .limit(limit)
            .offset(offset);

        // merchandise: use its stock quantity directly.
        // reusable: reusables don't track a numeric stock count — instead
        // their own `status` column tells us if the single unit is
        // available: "store" means it's on the shelf (1 available),
        // "checkedout" means it's out (0 available).
        const getAvailableQuantity = (row) => {
            if (row.type === "merchandise") {
                return row.merch_quantity ?? null;
            }
            if (row.type === "reusable") {
                const status = (row.reusable_status || "").toLowerCase();
                if (status === "checkedout" || status === "checked out" || status === "checked_out") {
                    return 0;
                }
                if (status === "store") {
                    return 1;
                }
                return null;
            }
            return null;
        };

        const result = items.map((i) => ({
            itemId: i.item_id,
            requestNo: i.request_no,
            email: i.name,
            requested_to: i.requested_to,
            date: i.date,
            type: i.type,
            itemName: i.item_name || "Unknown",
            quantity: i.quantity,
            status: i.status,
            avl_qty: getAvailableQuantity(i),
        }));

        return NextResponse.json({
            data: result,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to fetch pending requests" },
            { status: 500 }
        );
    }
}