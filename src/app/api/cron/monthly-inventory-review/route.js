import db from "@/lib/db";
import { NextResponse } from "next/server";
import { sendMail } from "@/lib/sendMail";

// Protects this route from being triggered by anyone who stumbles on the URL —
// only requests with the correct secret in the query string or header will run.
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const providedSecret =
      searchParams.get("secret") || request.headers.get("x-cron-secret");

    if (!CRON_SECRET || providedSecret !== CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admins = await db("users")
      .select("id", "email", "name", "location")
      .where({ isAdmin: "Yes" });

    if (admins.length === 0) {
      return NextResponse.json({ message: "No admin users found", sent: 0 });
    }

    const allLocations = await db("locations").select("id", "name");
    const locationNameById = new Map(
      allLocations.map((l) => [String(l.id), l.name]),
    );

    const systemLink =
      process.env.NEXT_PUBLIC_APP_URL || "https://your-app-domain.com";

    let sentCount = 0;

    for (const admin of admins) {
      const locationIds = Array.isArray(admin.location) ? admin.location : [];
      const locationNames = locationIds
        .map((id) => locationNameById.get(String(id)))
        .filter(Boolean);
      const locationText =
        locationNames.length > 0 ? locationNames.join(", ") : "your assigned location(s)";

      const html = `
                <p>Dear ${admin.name || "Inventory Owner"},</p>
                <p>As part of our monthly inventory management process, please take a few moments to review and validate the merchandise inventory recorded in the Merch Management System.</p>
                <p><strong>Location:</strong> ${locationText}</p>
                <p><strong>Action Required:</strong></p>
                <ul>
                  <li>Review all merchandise items assigned to your location.</li>
                  <li>Download the inventory report in PDF or Excel format for stock reconciliation.</li>
                  <li>Verify the physical stock quantities against the quantities recorded in the system.</li>
                  <li>Update any discrepancies identified during the review.</li>
                  <li>Confirm that inventory records are accurate and up to date.</li>
                </ul>
                <p><strong>Access the Merch Management System:</strong><br>${systemLink}</p>
                <p>Thank you for your cooperation and support in maintaining accurate inventory records.</p>
                <p>Best regards,<br>Merch Management System</p>
            `;

      try {
        await sendMail({
          to: admin.email,
          subject:
            "Monthly Inventory Review Required - Please Verify Merchandise Stock Levels",
          html,
        });
        sentCount += 1;
      } catch (mailError) {
        console.error(`Failed to send inventory review email to ${admin.email}`, mailError);
      }
    }

    return NextResponse.json({ message: "Monthly inventory reminders sent", sent: sentCount, total: admins.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to send monthly inventory reminders" },
      { status: 500 },
    );
  }
}