import { db } from "@/lib/db";
import { requireRole, ok, err } from "@/lib/api";

export const runtime = "nodejs";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

// GET /api/provider/analytics -> { analytics }
export async function GET() {
  const { user, response } = await requireRole("PROVIDER");
  if (response) return response;

  const provider = await db.providerProfile.findUnique({
    where: { userId: user!.id },
  });
  if (!provider) return err("Provider profile not found", 404, "NO_PROVIDER");

  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);

  // Today's orders
  const todaysOrders = await db.order.count({
    where: {
      providerId: provider.id,
      createdAt: { gte: dayStart, lte: dayEnd },
      status: { not: "CANCELLED" },
    },
  });

  const todaysAgg = await db.order.aggregate({
    where: {
      providerId: provider.id,
      createdAt: { gte: dayStart, lte: dayEnd },
      status: { not: "CANCELLED" },
    },
    _sum: { total: true },
  });
  const todaysRevenue = todaysAgg._sum.total || 0;

  // Today's meals rescued (sum of order item quantities for today's non-cancelled orders)
  const todaysOrderRows = await db.order.findMany({
    where: {
      providerId: provider.id,
      createdAt: { gte: dayStart, lte: dayEnd },
      status: { not: "CANCELLED" },
    },
    select: { id: true },
  });
  const todaysOrderIds = todaysOrderRows.map((o) => o.id);
  const todaysItemsAgg = await db.orderItem.aggregate({
    where: { orderId: { in: todaysOrderIds } },
    _sum: { quantity: true },
  });
  const todaysMealsRescued = todaysItemsAgg._sum.quantity || 0;

  // Active listings
  const activeListings = await db.foodListing.count({
    where: { providerId: provider.id, status: "ACTIVE" },
  });

  // Status breakdown
  const statusGroups = await db.foodListing.groupBy({
    by: ["status"],
    where: { providerId: provider.id },
    _count: { _all: true },
  });
  const statusBreakdown: Record<string, number> = {};
  for (const g of statusGroups) statusBreakdown[g.status] = g._count._all;

  // Last 7 days
  const days: { date: string; count: number; revenue: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const ds = startOfDay(d);
    const de = endOfDay(d);
    const dayOrders = await db.order.findMany({
      where: {
        providerId: provider.id,
        createdAt: { gte: ds, lte: de },
        status: { not: "CANCELLED" },
      },
      select: { total: true },
    });
    days.push({
      date: ds.toISOString().slice(0, 10),
      count: dayOrders.length,
      revenue: dayOrders.reduce((s, o) => s + o.total, 0),
    });
  }

  // Top foods by rescues — listing.rescues field.
  const topListingRows = await db.foodListing.findMany({
    where: { providerId: provider.id },
    orderBy: { rescues: "desc" },
    take: 5,
    select: {
      id: true,
      title: true,
      rescues: true,
      ciboPrice: true,
      originalPrice: true,
      images: true,
    },
  });
  const topFoods = topListingRows.map((l: any) => ({
    id: l.id,
    title: l.title,
    rescues: l.rescues,
    ciboPrice: l.ciboPrice,
    originalPrice: l.originalPrice,
  }));

  const totalOrders = provider.totalOrders;
  const totalRevenue = provider.totalRevenue;
  const mealsRescued = provider.mealsRescued;
  const wasteAvoidedKg = provider.wasteAvoidedKg;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const rating = provider.rating;

  return ok({
    analytics: {
      todaysOrders,
      todaysRevenue,
      todaysMealsRescued,
      activeListings,
      totalOrders,
      totalRevenue,
      mealsRescued,
      wasteAvoidedKg,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      rating,
      ordersLast7Days: days,
      topFoods,
      statusBreakdown,
    },
  });
}
