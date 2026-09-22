import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole, ok } from "@/lib/api";

export const runtime = "nodejs";

// GET /api/orders/stats -> customer rescue impact stats
export async function GET() {
  const { user, response } = await requireRole("CUSTOMER");
  if (response) return response;

  const orders = await db.order.findMany({
    where: { customerId: user!.id, status: { not: "CANCELLED" } },
    select: {
      id: true,
      total: true,
      discount: true,
      status: true,
      items: { select: { quantity: true } },
    },
  });

  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.status === "COMPLETED").length;
  const totalSpent = orders.reduce((s, o) => s + o.total, 0);
  const totalSaved = orders.reduce((s, o) => s + (o.discount || 0), 0);
  const mealsRescued = orders.reduce(
    (s, o) => s + o.items.reduce((a, b) => a + b.quantity, 0),
    0
  );
  // Approx CO2 avoided: ~0.4 kg per meal rescued
  const co2AvoidedKg = Math.round(mealsRescued * 0.4 * 10) / 10;
  const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

  // Favorite providers (most ordered from) — count orders per provider manually
  const allCustomerOrders = await db.order.findMany({
    where: { customerId: user!.id, status: { not: "CANCELLED" } },
    select: { providerId: true },
  });
  const providerCountMap: Record<string, number> = {};
  for (const o of allCustomerOrders) {
    providerCountMap[o.providerId] = (providerCountMap[o.providerId] || 0) + 1;
  }
  const sortedProviderIds = Object.entries(providerCountMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([pid]) => pid);
  const topProviders = await db.providerProfile.findMany({
    where: { id: { in: sortedProviderIds } },
    select: { id: true, businessName: true, rating: true, city: true },
  });
  const topProvidersWithCounts = sortedProviderIds
    .map((pid) => {
      const p = topProviders.find((x) => x.id === pid);
      const c = providerCountMap[pid] || 0;
      return p ? { ...p, orderCount: c } : null;
    })
    .filter(Boolean) as { id: string; businessName: string; rating: number; city: string; orderCount: number }[];

  return ok({
    stats: {
      totalOrders,
      completedOrders,
      totalSpent: Math.round(totalSpent * 100) / 100,
      totalSaved: Math.round(totalSaved * 100) / 100,
      mealsRescued,
      co2AvoidedKg,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      topProviders: topProvidersWithCounts,
    },
  });
}
