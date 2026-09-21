import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole, ok, err } from "@/lib/api";
import { toPublicUser } from "@/app/api/_lib/helpers";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/orders/:id/verify-otp { otp } -> { order }
// Provider verifies customer's pickup OTP. Sets COMPLETED on match.
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const { user, response } = await requireRole("PROVIDER");
  if (response) return response;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON body", 400, "BAD_BODY");
  }
  const otp = String(body.otp || "").trim();
  if (!otp) return err("OTP required", 400, "BAD_OTP");

  const provider = await db.providerProfile.findUnique({
    where: { userId: user!.id },
  });
  if (!provider) return err("Provider profile not found", 404, "NO_PROVIDER");

  const order = await db.order.findUnique({ where: { id } });
  if (!order || order.providerId !== provider.id) {
    return err("Order not found", 404, "NOT_FOUND");
  }
  if (order.status === "CANCELLED" || order.status === "REFUNDED") {
    return err("Order is already cancelled", 409, "TERMINAL");
  }
  if (order.status === "COMPLETED") {
    return err("Order already completed", 409, "ALREADY_DONE");
  }
  if (!order.pickupOtp || order.pickupOtp !== otp) {
    return err("Invalid OTP", 400, "BAD_OTP");
  }

  const updated = await db.$transaction(async (tx) => {
    const o = await tx.order.update({
      where: { id },
      data: { status: "COMPLETED", completedAt: new Date() },
      include: { items: true, provider: true, customer: true },
    });
    await tx.notification.create({
      data: {
        userId: order.customerId,
        type: "ORDER_READY",
        title: "Order completed",
        body: `Your order ${order.orderNumber} has been completed. Thank you for rescuing food!`,
        data: JSON.stringify({ orderId: order.id }),
      },
    });
    return o;
  });

  return ok({
    order: {
      ...updated,
      customer: updated.customer ? toPublicUser(updated.customer) : undefined,
    },
  });
}
