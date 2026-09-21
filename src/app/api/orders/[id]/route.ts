import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole, ok, err } from "@/lib/api";
import { toPublicUser } from "@/app/api/_lib/helpers";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/orders/:id -> { order } (include items + provider + review)
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const { user, response } = await requireRole("CUSTOMER", "PROVIDER");
  if (response) return response;

  const order = await db.order.findUnique({
    where: { id },
    include: { items: true, provider: true, review: true, customer: true },
  });
  if (!order) return err("Order not found", 404, "NOT_FOUND");

  // Customer can only see their own orders; provider can see orders they fulfill.
  const isOwner = order.customerId === user!.id;
  let isProvider = false;
  if (user!.role === "PROVIDER") {
    const provider = await db.providerProfile.findUnique({
      where: { userId: user!.id },
      select: { id: true },
    });
    isProvider = provider?.id === order.providerId;
  }
  if (!isOwner && !isProvider) {
    return err("Order not found", 404, "NOT_FOUND");
  }

  return ok({
    order: {
      ...order,
      customer: order.customer ? toPublicUser(order.customer) : undefined,
    },
  });
}
