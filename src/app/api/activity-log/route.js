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

        const applyFilters = (qb) => {
            if (locationId) {
                qb = qb.where({ location_id: locationId });
            }
            if (search && search.trim() !== "") {
                const term = `%${search.trim().toLowerCase()}%`;
                qb = qb.where((builder) => {
                    builder
                        .whereRaw("LOWER(email) LIKE ?", [term])
                        .orWhereRaw("LOWER(action) LIKE ?", [term])
                        .orWhereRaw("LOWER(comment) LIKE ?", [term]);
                });
            }
            return qb;
        };

        const countQuery = applyFilters(db("activity_logs"));
        const [{ count }] = await countQuery.count({ count: "*" });
        const total = Number(count);

        const logs = await applyFilters(db("activity_logs"))
            .select("id", "email", "action", "comment", "date", "location_id")
            .orderBy("date", "desc")
            .limit(limit)
            .offset(offset);

        return NextResponse.json({
            data: logs,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to fetch activity log" },
            { status: 500 }
        );
    }
}