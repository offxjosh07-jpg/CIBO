import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole, ok, err } from "@/lib/api";
import { toPublicUser } from "@/app/api/_lib/helpers";

export const runtime = "nodejs";

// Valid provider-driven status transitions.
const TRANSITIONS: Record<string, string[]> = {
  PLACED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["READY", "CANCELLED"],
  READY: ["PICKED_UP", "COMPLETED", "CANCELLED"],
  PICKED_UP: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  REFUNDED: [],
};

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: "Order confirmed by provider",
  READY: "Order is ready for pickup",
  PICKED_UP: "Order has been picked up",
  COMPLETED: "Order completed",
};

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/provider/orders/:id/status { status } -> { order }
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const { user, response } = await requireRole("PROVIDER");
  if (response) return response;

  const provider = await db.providerProfile.findUnique({
    where: { userId: user!.id },
  });
  if (!provider) return err("Provider profile not found", 404, "NO_PROVIDER");

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON body", 400, "BAD_BODY");
  }

  const newStatus = String(body.status || "").toUpperCase();
  if (!newStatus) return err("status required", 400, "BAD_STATUS");

  const order = await db.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order || order.providerId !== provider.id) {
    return err("Order not found", 404, "NOT_FOUND");
  }

  if (order.status === "CANCELLED" || order.status === "REFUNDED") {
    return err("Order is already cancelled/refunded", 409, "TERMINAL");
  }

  const allowed = TRANSITIONS[order.status] || [];
  if (!allowed.includes(newStatus)) {
    return err(
      `Cannot transition from ${order.status} to ${newStatus}`,
      400,
      "BAD_TRANSITION"
    );
  }

  const updated = await db.$transaction(async (tx) => {
    const data: any = { status: newStatus };
    if (newStatus === "COMPLETED") {
      data.completedAt = new Date();
    }
    const o = await tx.order.update({
      where: { id },
      data,
      include: { items: true, customer: true },
    });

    // Notify customer of each step.
    if (STATUS_LABELS[newStatus]) {
      await tx.notification.create({
        data: {
          userId: order.customerId,
          type: newStatus === "COMPLETED" ? "ORDER_READY" : "ORDER_READY",
          title: `Order ${o.orderNumber} update`,
          body: STATUS_LABELS[newStatus],
          data: JSON.stringify({ orderId: o.id, status: newStatus }),
        },
      });
    }

    return o;
  });

  return ok({
    order: {
      ...updated,
      customer: toPublicUser(updated.customer),
    },
  });
}
