import db from '@/lib/db'
import { NextResponse } from 'next/server'
import { logActivity } from "@/lib/logActivity";

export async function PATCH(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { checkoutTo, reason, email } = body;

        if (!checkoutTo || checkoutTo.trim() === "") {
            return NextResponse.json({ error: "Checkout target is required" }, { status: 400 });
        }

        const existingAsset = await db("reusables").where({ id }).first();
        if (!existingAsset) {
            return NextResponse.json({ error: "Asset not found" }, { status: 404 });
        }

        if (existingAsset.status === "Checked Out") {
            return NextResponse.json({ error: "This asset is already checked out" }, { status: 400 });
        }

        await db("reusables").where({ id }).update({
            status: "Checked Out",
            checkedout_email: checkoutTo.trim(),
        });

        const updatedAsset = await db("reusables").where({ id }).first();

        const locationRow = await db("locations")
            .where({ id: existingAsset.location })
            .first();
        const locationName = locationRow?.name || existingAsset.location;

        await logActivity({
            email: email || "unknown",
            action: "Asset Checked Out",
            comment: `"${existingAsset.name}" (code: ${existingAsset.itemCode}) checked out to ${checkoutTo.trim()}, location: ${locationName}${reason ? `. Reason: ${reason.trim()}` : ""}`,
            locationId: existingAsset.location,
        });

        return NextResponse.json(updatedAsset, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to check out asset" }, { status: 500 });
    }
}