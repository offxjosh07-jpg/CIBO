import { db } from "@/lib/db";
import { requireRole, ok } from "@/lib/api";
import { toPublicUser } from "@/app/api/_lib/helpers";

export const runtime = "nodejs";

// GET /api/admin/orders -> { orders } (include customer + provider + items)
export async function GET() {
  const { response } = await requireRole("ADMIN", "SUPPORT");
  if (response) return response;

  const orders = await db.order.findMany({
    include: { items: true, customer: true, provider: true },
    orderBy: { createdAt: "desc" },
  });

  return ok({
    orders: orders.map((o: any) => ({
      ...o,
      customer: o.customer ? toPublicUser(o.customer) : null,
    })),
  });
}
