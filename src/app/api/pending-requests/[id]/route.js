import db from "@/lib/db";
import { NextResponse } from "next/server";
import { logActivity } from "@/lib/logActivity";
import { sendMail } from "@/lib/sendMail";

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, email, reason } = body;

    if (!["approved", "declined"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    if (status === "declined" && (!reason || !reason.trim())) {
      return NextResponse.json(
        { error: "A reason is required to decline this request" },
        { status: 400 },
      );
    }

    const existingItem = await db("request_items").where({ id }).first();
    if (!existingItem) {
      return NextResponse.json(
        { error: "Request item not found" },
        { status: 404 },
      );
    }

    if (existingItem.status !== "pending") {
      return NextResponse.json(
        { error: "This request has already been actioned" },
        { status: 400 },
      );
    }

    const parentRequest = await db("requests")
      .where({ id: existingItem.request_id })
      .first();

    // Resolve user_id (the approver) from the submitted email up front
    const userRow = email
      ? await db("users").where({ email }).first()
      : null;

    let productName = "Unknown product";

    await db.transaction(async (trx) => {
      if (status === "approved" && existingItem.type === "merchandise") {
        const product = await trx("merchandises")
          .where({ id: existingItem.product_id })
          .first();

        if (!product) {
          throw new Error("Merchandise product not found");
        }

        if (product.quantity < existingItem.quantity) {
          throw new Error(
            `Insufficient stock: only ${product.quantity} available, ${existingItem.quantity} requested`,
          );
        }

        productName = product.name;

        await trx("merchandises")
          .where({ id: existingItem.product_id })
          .update({ quantity: product.quantity - existingItem.quantity });

        await trx("dashboard_data").insert({
          product_code: product.item_code,
          location_id: product.location,
          division_id: product.divisions,
          user_id: userRow ? userRow.id.toString() : null,
          added_qty: 0,
          removed_qty: existingItem.quantity,
          product_type: "merchandise",
        });
      }

      if (status === "approved" && existingItem.type === "print_pos") {
        const product = await trx("print_pos")
          .where({ id: existingItem.product_id })
          .first();

        if (!product) {
          throw new Error("Print & POS product not found");
        }

        if (product.quantity < existingItem.quantity) {
          throw new Error(
            `Insufficient stock: only ${product.quantity} available, ${existingItem.quantity} requested`,
          );
        }

        productName = product.name;

        await trx("print_pos")
          .where({ id: existingItem.product_id })
          .update({ quantity: product.quantity - existingItem.quantity });

        await trx("dashboard_data").insert({
          product_code: product.item_code,
          location_id: product.location,
          division_id: product.divisions,
          user_id: userRow ? userRow.id.toString() : null,
          added_qty: 0,
          removed_qty: existingItem.quantity,
          product_type: "print_pos",
        });
      }

      if (status === "approved" && existingItem.type === "reusable") {
        const asset = await trx("reusables")
          .where({ id: existingItem.product_id })
          .first();

        if (!asset) {
          throw new Error("Reusable asset not found");
        }

        if (asset.status === "Checked Out") {
          throw new Error("This asset is already checked out");
        }

        productName = asset.name;

        await trx("reusables")
          .where({ id: existingItem.product_id })
          .update({ status: "Checked Out" });

        await trx("dashboard_data").insert({
          product_code: asset.item_code,
          location_id: asset.location,
          division_id: asset.divisions,
          user_id: userRow ? userRow.id.toString() : null,
          added_qty: 0,
          removed_qty: existingItem.quantity,
          product_type: "reusable",
        });
      }

      await trx("request_items").where({ id }).update({ status });
    });

    const updatedItem = await db("request_items").where({ id }).first();

    if (productName === "Unknown product") {
      const sourceTable =
        existingItem.type === "merchandise"
          ? "merchandises"
          : existingItem.type === "print_pos"
            ? "print_pos"
            : "reusables";
      const product = await db(sourceTable)
        .where({ id: existingItem.product_id })
        .first();
      productName = product?.name || "Unknown product";
    }

    const reasonText =
      status === "declined" && reason ? ` Reason: ${reason.trim()}` : "";

    await logActivity({
      email: email || "unknown",
      action: status === "approved" ? "Request Approved" : "Request Declined",
      comment:
        `Request ${parentRequest?.request_no || existingItem.request_id} — ` +
        `${status} "${productName}" (${existingItem.type}, qty: ${existingItem.quantity}) ` +
        `requested by ${parentRequest?.email || "unknown"}.${reasonText}`,
      locationId: parentRequest?.location,
    });

    // --- Email notifications ---
    // Resolve names/location for the email bodies. Failures here never
    // block the response — status has already been committed above.
    try {
      const locationRow = parentRequest?.location
        ? await db("locations").where({ id: parentRequest.location }).first()
        : null;
      const locationName = locationRow?.name || "—";

      const approverName = userRow?.name || email || "the approver";
      const requesterName = parentRequest?.name || "there";
      const requesterEmail = parentRequest?.email;
      const approverEmail = parentRequest?.requested_to || email;

      if (status === "approved") {
        const approvedHtml = `
                <p>Dear ${requesterName},</p>
                <p>Good news! Your merchandise request has been reviewed and approved.</p>
                <p><strong>Approved Request Details</strong></p>
                <ul>
                  <li><strong>Merchandise Item:</strong> ${productName}</li>
                  <li><strong>Quantity:</strong> ${existingItem.quantity}</li>
                  <li><strong>Location:</strong> ${locationName}</li>
                  <li><strong>Reason for Request:</strong> ${parentRequest?.reason || "—"}</li>
                  <li><strong>Approved By:</strong> ${approverName}</li>
                  <li><strong>Request ID:</strong> ${parentRequest?.request_no || existingItem.request_id}</li>
                </ul>
                <p>Best regards,<br>Merch Management System</p>
            `;

        if (requesterEmail) {
          await sendMail({
            to: requesterEmail,
            subject: `Your Merchandise Request Has Been Approved - ${productName}`,
            html: approvedHtml,
          });
        }

        if (approverEmail) {
          await sendMail({
            to: approverEmail,
            subject: `Your Merchandise Request Has Been Approved - ${productName}`,
            html: approvedHtml,
          });
        }
      } else {
        const declinedHtml = `
                <p>Dear ${requesterName},</p>
                <p>We regret to inform you that your merchandise request has not been approved.</p>
                <p><strong>Request Details</strong></p>
                <ul>
                  <li><strong>Merchandise Item:</strong> ${productName}</li>
                  <li><strong>Quantity:</strong> ${existingItem.quantity}</li>
                  <li><strong>Location:</strong> ${locationName}</li>
                  <li><strong>Reason for Request:</strong> ${parentRequest?.reason || "—"}</li>
                  <li><strong>Reviewed By:</strong> ${approverName}</li>
                  <li><strong>Request ID:</strong> ${parentRequest?.request_no || existingItem.request_id}</li>
                </ul>
                <p><strong>Decline Reason:</strong> ${reason ? reason.trim() : "—"}</p>
                <p>If appropriate, you may revise the request and resubmit it after addressing the feedback provided above.</p>
                <p>Should you require clarification regarding this decision, please contact ${approverName} or the Merchandising Team.</p>
                <p>Thank you for your understanding.</p>
                <p>Best regards,<br>Merch Management System</p>
            `;

        if (requesterEmail) {
          await sendMail({
            to: requesterEmail,
            subject: `Merchandise Request Declined - ${productName}`,
            html: declinedHtml,
          });
        }

        if (approverEmail) {
          await sendMail({
            to: approverEmail,
            subject: `Merchandise Request Declined - ${productName}`,
            html: declinedHtml,
          });
        }
      }
    } catch (mailError) {
      console.error("Failed to send status notification email", mailError);
    }

    return NextResponse.json(updatedItem, { status: 200 });
  } catch (error) {
    console.error(error);
    const knownErrors = [
      "Merchandise product not found",
      "Print & POS product not found",
      "Reusable asset not found",
      "This asset is already checked out",
    ];
    const isInsufficientStock =
      error?.message?.startsWith("Insufficient stock");
    const isKnownError =
      knownErrors.includes(error?.message) || isInsufficientStock;

    const message = isKnownError ? error.message : "Failed to update status";
    const statusCode = isKnownError ? 400 : 500;

    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
