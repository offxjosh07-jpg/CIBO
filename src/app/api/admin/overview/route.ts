import { db } from "@/lib/db";
import { requireRole, ok } from "@/lib/api";

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

// GET /api/admin/overview -> { overview }
export async function GET() {
  const { response } = await requireRole("ADMIN", "SUPPORT");
  if (response) return response;

  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);

  const [
    totalUsers,
    customers,
    providers,
    verifiedProviders,
    todaysOrdersRows,
    activeListings,
    expiredListings,
    openComplaints,
    refunds,
    completedItemsAgg,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.user.count({ where: { role: "PROVIDER" } }),
    db.providerProfile.count({ where: { verificationStatus: "VERIFIED" } }),
    db.order.findMany({
      where: { createdAt: { gte: dayStart, lte: dayEnd }, status: { not: "CANCELLED" } },
      select: { total: true, platformFee: true },
    }),
    db.foodListing.count({ where: { status: "ACTIVE" } }),
    db.foodListing.count({ where: { status: "EXPIRED" } }),
    db.complaint.count({ where: { status: { in: ["OPEN", "INVESTIGATING"] } } }),
    db.payment.count({ where: { status: "REFUNDED" } }),
    db.orderItem.aggregate({
      where: { order: { status: "COMPLETED" } },
      _sum: { quantity: true },
    }),
  ]);

  const todaysGMV = todaysOrdersRows.reduce((s, o) => s + o.total, 0);
  const platformRevenue = todaysOrdersRows.reduce((s, o) => s + o.platformFee, 0);
  const mealsRescued = completedItemsAgg._sum.quantity || 0;
  const wasteAvoidedKg = mealsRescued * 0.4;

  // 7-day series
  const days: { date: string; count: number; gmv: number; revenue: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const ds = startOfDay(d);
    const de = endOfDay(d);
    const dayOrders = await db.order.findMany({
      where: {
        createdAt: { gte: ds, lte: de },
        status: { not: "CANCELLED" },
      },
      select: { total: true, platformFee: true },
    });
    days.push({
      date: ds.toISOString().slice(0, 10),
      count: dayOrders.length,
      gmv: dayOrders.reduce((s, o) => s + o.total, 0),
      revenue: dayOrders.reduce((s, o) => s + o.platformFee, 0),
    });
  }

  // Top providers by revenue
  const topProvidersRaw = await db.providerProfile.findMany({
    orderBy: { totalRevenue: "desc" },
    take: 5,
    select: {
      id: true,
      businessName: true,
      totalRevenue: true,
      totalOrders: true,
      rating: true,
    },
  });

  // City breakdown of providers
  const cityGroups = await db.providerProfile.groupBy({
    by: ["city"],
    _count: { _all: true },
  });
  const cityBreakdown: Record<string, number> = {};
  for (const g of cityGroups) {
    if (g.city) cityBreakdown[g.city] = g._count._all;
  }

  return ok({
    overview: {
      totalUsers,
      customers,
      providers,
      verifiedProviders,
      todaysOrders: todaysOrdersRows.length,
      todaysGMV,
      platformRevenue,
      mealsRescued,
      wasteAvoidedKg,
      activeListings,
      expiredListings,
      openComplaints,
      refunds,
      ordersLast7Days: days.map((d) => ({ date: d.date, count: d.count })),
      revenueLast7Days: days.map((d) => ({ date: d.date, revenue: d.revenue })),
      topProviders: topProvidersRaw,
      cityBreakdown,
    },
  });
}
