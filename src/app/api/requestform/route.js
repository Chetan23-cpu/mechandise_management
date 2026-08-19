import db from '@/lib/db'
import { NextResponse } from 'next/server'
import { logActivity } from "@/lib/logActivity";
import { sendMail } from "@/lib/sendMail";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const locationId = searchParams.get("locationId");
        const type = searchParams.get("type");
        const wantUsers = searchParams.get("users");

        // "Request to" lookup: users whose location JSON array contains this locationId
        if (locationId && wantUsers === "true") {
            const users = await db("users")
                .select("id", "email")
                .whereRaw("JSON_CONTAINS(location, ?)", [JSON.stringify(Number(locationId))])
                .orderBy("email");
            return NextResponse.json(users);
        }

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
        const { name, email, locationId, requestedTo, reason, items } = body;

        if (!name || name.trim() === "") {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }
        if (!email || email.trim() === "") {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }
        if (!locationId) {
            return NextResponse.json({ error: "Location is required" }, { status: 400 });
        }
        if (!requestedTo || requestedTo.trim() === "") {
            return NextResponse.json({ error: "Request to is required" }, { status: 400 });
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
                requested_to: requestedTo.trim(),
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
            comment: `Request ${savedRequest.request_no} submitted with ${savedItems.length} item(s), location: ${locationName}, requested to: ${requestedTo.trim()}. Reason: ${reason.trim()}`,
            locationId: locationId,
        });

        // Fetch item names for the email body (savedItems only has product_id)
        const itemDetails = await Promise.all(
            savedItems.map(async (item) => {
                const table = item.type === "merchandise" ? "merchandises" : "reusables";
                const product = await db(table).where({ id: item.product_id }).first();
                return `${product?.name || "Unknown item"} × ${item.quantity}`;
            })
        );
        const itemsListHtml = itemDetails.map((line) => `<li>${line}</li>`).join("");

        // Confirmation email to the requester — failures here never block the response
        await sendMail({
            to: email.trim(),
            subject: `Request ${savedRequest.request_no} submitted`,
            html: `
                <p>Hi ${name.trim()},</p>
                <p>Your merchandise request has been submitted successfully.</p>
                <p><strong>Request ID:</strong> ${savedRequest.request_no}</p>
                <p><strong>Location:</strong> ${locationName}</p>
                <p><strong>Requested to:</strong> ${requestedTo.trim()}</p>
                <p><strong>Reason:</strong> ${reason.trim()}</p>
                <p><strong>Items:</strong></p>
                <ul>${itemsListHtml}</ul>
                <p>You'll be notified once this request is reviewed.</p>
            `,
        });

        // Notification email to the person the request was made to
        await sendMail({
            to: requestedTo.trim(),
            subject: `New request awaiting your review — ${savedRequest.request_no}`,
            html: `
                <p>Hello,</p>
                <p>${name.trim()} (${email.trim()}) has submitted a merchandise request that needs your review.</p>
                <p><strong>Request ID:</strong> ${savedRequest.request_no}</p>
                <p><strong>Location:</strong> ${locationName}</p>
                <p><strong>Reason:</strong> ${reason.trim()}</p>
                <p><strong>Items:</strong></p>
                <ul>${itemsListHtml}</ul>
                <p>Please log in to review and approve or decline this request.</p>
            `,
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
