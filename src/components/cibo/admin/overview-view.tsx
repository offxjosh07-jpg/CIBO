"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users as UsersIcon,
  UserCheck,
  Store,
  ClipboardList,
  IndianRupee,
  Wallet,
  Sparkles,
  Leaf,
  Package,
  PackageX,
  MessageSquareWarning,
  RefreshCw,
  MapPin,
  Star,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { fmtPrice, timeAgo, fmtDateTime } from "@/lib/utils";
import {
  PageShell,
  Panel,
  StatCard,
  StatSkeleton,
  CHART_COLORS,
} from "./shared";
import { OrderStatusPill, ComplaintStatusPill, VerificationPill } from "./shared";

export function OverviewView() {
  const ovQ = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => adminApi.overview(),
  });
  const ordersQ = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: () => adminApi.orders(),
  });
  const complaintsQ = useQuery({
    queryKey: ["admin", "complaints"],
    queryFn: () => adminApi.complaints(),
  });
  const providersQ = useQuery({
    queryKey: ["admin", "providers"],
    queryFn: () => adminApi.providers(),
  });

  const ov = ovQ.data?.overview;
  const orders = ordersQ.data?.orders || [];
  const complaints = complaintsQ.data?.complaints || [];
  const providers = providersQ.data?.providers || [];

  // Build 7-day chart data
  const chartData = (ov?.ordersLast7Days || []).map((d: any, i: number) => {
    const rev = ov?.revenueLast7Days?.[i]?.revenue || 0;
    return {
      date: new Date(d.date).toLocaleDateString("en-IN", { weekday: "short" }),
      orders: d.count,
      revenue: rev,
    };
  });

  // Build recent activity feed: combine orders + complaints + verifications
  type Activity = {
    id: string;
    kind: "order" | "complaint" | "verification";
    title: string;
    sub: string;
    when: string;
    badge?: React.ReactNode;
  };
  const activity: Activity[] = [];
  for (const o of orders.slice(0, 8)) {
    activity.push({
      id: `o-${o.id}`,
      kind: "order",
      title: `Order ${o.orderNumber}`,
      sub: `${(o as any).customer?.name || "Customer"} · ${fmtPrice(o.total)}`,
      when: o.createdAt,
      badge: <OrderStatusPill status={o.status} />,
    });
  }
  for (const c of complaints.slice(0, 6)) {
    activity.push({
      id: `c-${c.id}`,
      kind: "complaint",
      title: `${c.type} complaint`,
      sub: (c as any).user?.name || "Customer",
      when: c.createdAt,
      badge: <ComplaintStatusPill status={c.status} />,
    });
  }
  for (const p of providers.filter((x: any) => x.verificationStatus !== "PENDING").slice(0, 6)) {
    activity.push({
      id: `v-${p.id}`,
      kind: "verification",
      title: `${p.businessName} verification`,
      sub: `${p.verificationStatus}`,
      when: (p as any).createdAt || new Date().toISOString(),
      badge: <VerificationPill status={p.verificationStatus} />,
    });
  }
  activity.sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());
  const recentActivity = activity.slice(0, 10);

  // City breakdown (max bar for scale)
  const cityEntries = Object.entries(ov?.cityBreakdown || {}) as [string, number][];
  const cityMax = Math.max(1, ...cityEntries.map(([, v]) => v));

  return (
    <PageShell className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-forest sm:text-3xl">
            Platform overview
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Live snapshot of CIBO marketplace health and operations.
          </p>
        </div>
        <button
          onClick={() => {
            ovQ.refetch();
            ordersQ.refetch();
            complaintsQ.refetch();
            providersQ.refetch();
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-forest/15 bg-card px-3 py-2 text-xs font-semibold text-forest transition hover:border-gold hover:bg-cream/60"
        >
          <RefreshCw className="size-3.5" /> Refresh
        </button>
      </div>

      {/* KPI cards */}
      {ovQ.isLoading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <StatSkeleton key={i} />
          ))}
        </div>
      ) : ov ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          <StatCard
            label="Total users"
            value={ov.totalUsers.toLocaleString("en-IN")}
            sub={`${ov.customers} customers · ${ov.providers} providers`}
            icon={<UsersIcon className="size-5" />}
            tone="forest"
            delta={8}
          />
          <StatCard
            label="Active users (7d)"
            value={Math.round(ov.totalUsers * 0.42).toLocaleString("en-IN")}
            sub="Mock estimate"
            icon={<UserCheck className="size-5" />}
            tone="success"
            delta={5}
          />
          <StatCard
            label="Verified providers"
            value={ov.verifiedProviders.toLocaleString("en-IN")}
            sub={`${ov.providers} total`}
            icon={<Store className="size-5" />}
            tone="olive"
            delta={3}
          />
          <StatCard
            label="Today's orders"
            value={ov.todaysOrders.toLocaleString("en-IN")}
            sub="Last 24 hours"
            icon={<ClipboardList className="size-5" />}
            tone="orange"
            delta={12}
          />
          <StatCard
            label="Today's GMV"
            value={fmtPrice(ov.todaysGMV)}
            sub="Gross merchandise value"
            icon={<IndianRupee className="size-5" />}
            tone="gold"
            delta={9}
          />
          <StatCard
            label="Platform revenue"
            value={fmtPrice(ov.platformRevenue)}
            sub="Today's commission"
            icon={<Wallet className="size-5" />}
            tone="forest"
            delta={11}
          />
          <StatCard
            label="Meals rescued"
            value={ov.mealsRescued.toLocaleString("en-IN")}
            sub="All-time completed"
            icon={<Sparkles className="size-5" />}
            tone="orange"
            delta={15}
          />
          <StatCard
            label="Waste avoided"
            value={`${Math.round(ov.wasteAvoidedKg)}kg`}
            sub="Estimated"
            icon={<Leaf className="size-5" />}
            tone="success"
            delta={15}
          />
          <StatCard
            label="Active listings"
            value={ov.activeListings.toLocaleString("en-IN")}
            sub={`${ov.expiredListings} expired`}
            icon={<Package className="size-5" />}
            tone="olive"
            delta={4}
          />
          <StatCard
            label="Expired listings"
            value={ov.expiredListings.toLocaleString("en-IN")}
            sub="To be pruned"
            icon={<PackageX className="size-5" />}
            tone="forest"
            delta={-2}
          />
          <StatCard
            label="Open complaints"
            value={ov.openComplaints.toLocaleString("en-IN")}
            sub="Needs attention"
            icon={<MessageSquareWarning className="size-5" />}
            tone="orange"
            delta={-1}
          />
          <StatCard
            label="Refunds"
            value={ov.refunds.toLocaleString("en-IN")}
            sub="All-time"
            icon={<RefreshCw className="size-5" />}
            tone="gold"
            delta={0}
          />
        </div>
      ) : null}

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Orders · last 7 days"
          subtitle="Daily order volume across the platform"
        >
          {ovQ.isLoading ? (
            <Skeleton className="h-64 w-full rounded-xl cibo-skeleton" />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 6, right: 6, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gAdmOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.orange} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={CHART_COLORS.orange} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(24,46,32,0.06)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid rgba(24,46,32,0.1)",
                      background: "#fff",
                      fontSize: 12,
                    }}
                    labelStyle={{ fontWeight: 700, color: "#1E3A28" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="orders"
                    stroke={CHART_COLORS.orange}
                    strokeWidth={2}
                    fill="url(#gAdmOrders)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel
          title="Revenue · last 7 days"
          subtitle="Daily platform commission (₹)"
        >
          {ovQ.isLoading ? (
            <Skeleton className="h-64 w-full rounded-xl cibo-skeleton" />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 6, right: 6, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(24,46,32,0.06)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid rgba(24,46,32,0.1)",
                      background: "#fff",
                      fontSize: 12,
                    }}
                    labelStyle={{ fontWeight: 700, color: "#1E3A28" }}
                    formatter={(v: any) => [fmtPrice(v as number), "Revenue"]}
                  />
                  <Bar
                    dataKey="revenue"
                    fill={CHART_COLORS.success}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
      </div>

      {/* Top providers + city breakdown */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Top providers by revenue"
          subtitle="All-time highest earners"
        >
          {ovQ.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl cibo-skeleton" />
              ))}
            </div>
          ) : ov?.topProviders?.length ? (
            <ul className="space-y-2">
              {ov.topProviders.map((p: any, i: number) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl bg-cream/30 p-2.5"
                >
                  <div className="grid size-7 place-items-center rounded-lg bg-forest text-[10px] font-bold text-gold">
                    #{i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-forest">
                      {p.businessName}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {p.totalOrders} orders · ⭐ {p.rating?.toFixed(1) || "—"}
                    </p>
                  </div>
                  <p className="font-display text-sm font-bold text-forest">
                    {fmtPrice(p.totalRevenue)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-xs text-muted-foreground">
              No provider data yet.
            </p>
          )}
        </Panel>

        <Panel
          title="City breakdown"
          subtitle="Providers per city"
        >
          {ovQ.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl cibo-skeleton" />
              ))}
            </div>
          ) : cityEntries.length ? (
            <ul className="space-y-3">
              {cityEntries
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([city, count]) => (
                  <li key={city}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-forest">
                        <MapPin className="size-3 text-gold" /> {city}
                      </span>
                      <span className="font-bold text-forest">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-cream/60">
                      <div
                        className="h-full rounded-full bg-orange"
                        style={{ width: `${(count / cityMax) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-xs text-muted-foreground">
              No city data yet.
            </p>
          )}
        </Panel>
      </div>

      {/* Recent activity feed */}
      <Panel
        title="Recent activity"
        subtitle="Latest orders, complaints, and verifications"
      >
        {recentActivity.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            No recent activity.
          </p>
        ) : (
          <ul className="space-y-1">
            {recentActivity.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-3 rounded-xl border border-forest/5 bg-cream/20 p-2.5 transition hover:bg-cream/40"
              >
                <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-forest text-ivory">
                  {a.kind === "order" ? (
                    <ClipboardList className="size-4" />
                  ) : a.kind === "complaint" ? (
                    <MessageSquareWarning className="size-4" />
                  ) : (
                    <Star className="size-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-forest">{a.title}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{a.sub}</p>
                </div>
                {a.badge}
                <span className="hidden text-[10px] text-muted-foreground sm:inline">
                  {timeAgo(a.when)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* Footer note */}
      <p className="text-center text-[10px] text-muted-foreground">
        Last updated {fmtDateTime(new Date())} · CIBO Admin · Good Food, Brighter Tomorrow
      </p>
    </PageShell>
  );
}
