import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole, ok, err } from "@/lib/api";
import { toPublicUser } from "@/app/api/_lib/helpers";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/orders/:id/cancel { reason } -> { order }
// Only if status is PLACED or CONFIRMED. Restore inventory transactionally.
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const { user, response } = await requireRole("CUSTOMER");
  if (response) return response;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON body", 400, "BAD_BODY");
  }
  const reason = body.reason ? String(body.reason) : null;

  const order = await db.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) return err("Order not found", 404, "NOT_FOUND");
  if (order.customerId !== user!.id) {
    return err("Order not found", 404, "NOT_FOUND");
  }
  if (order.status !== "PLACED" && order.status !== "CONFIRMED") {
    return err(
      `Cannot cancel order in status ${order.status}`,
      409,
      "BAD_STATUS"
    );
  }

  const updated = await db.$transaction(async (tx) => {
    // Restore inventory: increment each listing's quantity.
    for (const item of order.items) {
      if (!item.listingId) continue;
      const listing = await tx.foodListing.findUnique({
        where: { id: item.listingId },
      });
      if (!listing) continue;

      const restoredQty = listing.quantity + item.quantity;
      const newStatus =
        listing.status === "SOLD_OUT" && restoredQty > 0
          ? "ACTIVE"
          : listing.status;

      await tx.foodListing.update({
        where: { id: listing.id },
        data: {
          quantity: restoredQty,
          status: newStatus,
          rescues: { decrement: item.quantity },
        },
      });
    }

    const o = await tx.order.update({
      where: { id: order.id },
      data: {
        status: "CANCELLED",
        paymentStatus: "REFUNDED",
        cancelledReason: reason,
      },
      include: { items: true, provider: true, customer: true },
    });

    // Reverse provider totals.
    const totalQty = order.items.reduce((s, it) => s + it.quantity, 0);
    await tx.providerProfile.update({
      where: { id: order.providerId },
      data: {
        totalOrders: { decrement: 1 },
        totalRevenue: { decrement: order.total },
        mealsRescued: { decrement: totalQty },
        wasteAvoidedKg: { decrement: totalQty * 0.4 },
      },
    });

    // Reverse customer totals.
    await tx.customerProfile.update({
      where: { userId: order.customerId },
      data: {
        totalOrders: { decrement: 1 },
        totalSpent: { decrement: order.total },
        mealsRescued: { decrement: totalQty },
      },
    });

    // Update payment record
    await tx.payment.updateMany({
      where: { orderId: order.id },
      data: { status: "REFUNDED" },
    });

    // Notify customer
    await tx.notification.create({
      data: {
        userId: order.customerId,
        type: "REFUND",
        title: "Order cancelled",
        body: `Order ${order.orderNumber} has been cancelled. Refund processed.`,
        data: JSON.stringify({ orderId: order.id, reason }),
      },
    });

    // Notify provider
    const provider = await tx.providerProfile.findUnique({
      where: { id: order.providerId },
      select: { userId: true },
    });
    if (provider) {
      await tx.notification.create({
        data: {
          userId: provider.userId,
          type: "REFUND",
          title: "Order cancelled by customer",
          body: `Order ${order.orderNumber} has been cancelled. Inventory restored.`,
          data: JSON.stringify({ orderId: order.id }),
        },
      });
    }

    return o;
  });

  return ok({
    order: {
      ...updated,
      customer: updated.customer ? toPublicUser(updated.customer) : undefined,
    },
  });
}
