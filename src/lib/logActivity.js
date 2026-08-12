import db from "@/lib/db";

export async function logActivity({ email, action, comment, locationId }) {
    try {
        await db("activity_logs").insert({
            email: email ?? null,
            action,
            comment: comment || null,
            location_id: locationId || null,
        });
    } catch (error) {
        console.error("Failed to write activity log:", error);
    }
}