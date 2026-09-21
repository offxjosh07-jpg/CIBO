import { db } from "@/lib/db";
import { requireRole, ok, err } from "@/lib/api";
import { toPublicUser } from "@/app/api/_lib/helpers";

export const runtime = "nodejs";

// GET /api/provider/orders -> { orders } (all orders for this provider)
export async function GET() {
  const { user, response } = await requireRole("PROVIDER");
  if (response) return response;

  const provider = await db.providerProfile.findUnique({
    where: { userId: user!.id },
  });
  if (!provider) return err("Provider profile not found", 404, "NO_PROVIDER");

  const orders = await db.order.findMany({
    where: { providerId: provider.id },
    include: {
      items: true,
      customer: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return ok({
    orders: orders.map((o: any) => ({
      ...o,
      customer: toPublicUser(o.customer),
    })),
  });
}
