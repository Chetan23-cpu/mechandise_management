import db from '@/lib/db'
import { NextResponse } from 'next/server'
import { logActivity } from "@/lib/logActivity";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const locationId = searchParams.get("locationId");
        const type = searchParams.get("type");

        // Product lookup: location + type both provided
        if (locationId && type) {
            if (type === "merchandise") {
                const products = await db("merchandises")
                    .select("id", "name")
                    .where({ location: locationId })
                    .orderBy("name");
                return NextResponse.json(products);
            }

            if (type === "reusable") {
                const products = await db("reusables")
                    .select("id", "name")
                    .where({ location: locationId })
                    .orderBy("name");
                return NextResponse.json(products);
            }

            return NextResponse.json({ error: "Invalid type" }, { status: 400 });
        }

        // Default: return locations for the dropdown
        const locations = await db("locations").select("id", "name").orderBy("name");
        return NextResponse.json(locations);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to fetch request form data" },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, email, locationId, reason, items } = body;

        if (!name || name.trim() === "") {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }
        if (!email || email.trim() === "") {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }
        if (!locationId) {
            return NextResponse.json({ error: "Location is required" }, { status: 400 });
        }
        if (!reason || reason.trim() === "") {
            return NextResponse.json({ error: "Reason is required" }, { status: 400 });
        }
        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: "At least one product is required" }, { status: 400 });
        }

        for (const item of items) {
            if (!item.type || !["merchandise", "reusable"].includes(item.type)) {
                return NextResponse.json({ error: "Each item must have a valid type" }, { status: 400 });
            }
            if (!item.productId) {
                return NextResponse.json({ error: "Each item must have a productId" }, { status: 400 });
            }
        }

        const requestNo = `REQ-${Date.now()}`;

        const requestId = await db.transaction(async (trx) => {
            const [insertedId] = await trx("requests").insert({
                request_no: requestNo,
                name: name.trim(),
                email: email.trim(),
                location: locationId,
                reason: reason.trim(),
            });

            const itemRows = items.map((item) => ({
                request_id: insertedId,
                type: item.type,
                product_id: item.productId,
                quantity: item.quantity && item.quantity > 0 ? item.quantity : 1,
                status: "pending",
            }));

            await trx("request_items").insert(itemRows);

            return insertedId;
        });

        const savedRequest = await db("requests").where({ id: requestId }).first();
        const savedItems = await db("request_items").where({ request_id: requestId });

        const locationRow = await db("locations").where({ id: locationId }).first();
        const locationName = locationRow?.name || locationId;

        await logActivity({
            email: email.trim(),
            action: "Request Submitted",
            comment: `Request ${savedRequest.request_no} submitted with ${savedItems.length} item(s), location: ${locationName}. Reason: ${reason.trim()}`,
            locationId: locationId,
        });

        return NextResponse.json(
            { ...savedRequest, items: savedItems },
            { status: 201 }
        );
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to submit request" },
            { status: 500 }
        );
    }
}