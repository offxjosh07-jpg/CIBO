"use client";

import { useQuery } from "@tanstack/react-query";
import { providerApi } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  IndianRupee,
  TrendingDown,
  Clock,
  Sparkles,
  Leaf,
  Timer,
} from "lucide-react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { fmtPrice } from "@/lib/utils";
import {
  CHART_COLORS,
  EmptyState,
  PageShell,
  Panel,
  StatCard,
  StatSkeleton,
} from "./shared";

export function AnalyticsView() {
  const aQ = useQuery({
    queryKey: ["provider", "analytics"],
    queryFn: () => providerApi.analytics(),
  });
  const a = aQ.data?.analytics;

  const lineData = (a?.ordersLast7Days || []).map((d: any) => ({
    date: new Date(d.date).toLocaleDateString("en-IN", { weekday: "short" }),
    orders: d.count,
  }));
  const areaData = (a?.ordersLast7Days || []).map((d: any) => ({
    date: new Date(d.date).toLocaleDateString("en-IN", { weekday: "short" }),
    revenue: d.revenue,
  }));
  const topFoodsData = (a?.topFoods || [])
    .slice(0, 5)
    .map((f: any) => ({
      name: f.title.length > 16 ? f.title.slice(0, 14) + "…" : f.title,
      rescues: f.rescues || 0,
    }));

  const statusEntries = Object.entries(a?.statusBreakdown || {}).map(
    ([k, v]) => ({ name: k.replace("_", " "), value: v as number })
  );
  const PIE_COLORS = [
    CHART_COLORS.success,
    CHART_COLORS.orange,
    CHART_COLORS.gold,
    CHART_COLORS.olive,
    CHART_COLORS.danger,
  ];

  const cancellationRate =
    a && a.totalOrders > 0
      ? ((a.statusBreakdown?.CANCELLED || 0) / a.totalOrders) * 100
      : 0;

  return (
    <PageShell className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-forest sm:text-3xl">
          Analytics
        </h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Deep dive into your rescue performance and trends.
        </p>
      </div>

      {/* KPI cards */}
      {aQ.isLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <StatSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard
            label="Avg order value"
            value={fmtPrice(a?.avgOrderValue ?? 0)}
            icon={<IndianRupee className="size-5" />}
            tone="forest"
          />
          <StatCard
            label="Cancellation rate"
            value={`${cancellationRate.toFixed(1)}%`}
            icon={<TrendingDown className="size-5" />}
            tone="orange"
          />
          <StatCard
            label="Meals rescued"
            value={a?.mealsRescued ?? 0}
            icon={<Sparkles className="size-5" />}
            tone="success"
          />
          <StatCard
            label="Waste avoided"
            value={`${Math.round(a?.wasteAvoidedKg ?? 0)}kg`}
            icon={<Leaf className="size-5" />}
            tone="olive"
          />
          <StatCard
            label="Total orders"
            value={a?.totalOrders ?? 0}
            icon={<BarChart3 className="size-5" />}
            tone="gold"
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Orders trend · last 7 days" subtitle="Daily order count">
          {aQ.isLoading ? (
            <Skeleton className="h-56 w-full rounded-xl cibo-skeleton" />
          ) : lineData.length === 0 ? (
            <EmptyState
              title="No data yet"
              description="Order trends will appear once you have orders."
              icon={<BarChart3 className="size-5" />}
            />
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 6, right: 6, left: -10, bottom: 0 }}>
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
                  />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke={CHART_COLORS.orange}
                    strokeWidth={3}
                    dot={{ fill: CHART_COLORS.orange, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel title="Revenue trend · last 7 days" subtitle="Daily gross revenue">
          {aQ.isLoading ? (
            <Skeleton className="h-56 w-full rounded-xl cibo-skeleton" />
          ) : areaData.length === 0 ? (
            <EmptyState
              title="No data yet"
              description="Revenue trends will appear here."
              icon={<IndianRupee className="size-5" />}
            />
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaData} margin={{ top: 6, right: 6, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gRevArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.success} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={CHART_COLORS.success} stopOpacity={0} />
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
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid rgba(24,46,32,0.1)",
                      background: "#fff",
                      fontSize: 12,
                    }}
                    formatter={(v: any) => [fmtPrice(v as number), "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={CHART_COLORS.success}
                    strokeWidth={2}
                    fill="url(#gRevArea)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel title="Top rescued foods" subtitle="By total rescues">
          {aQ.isLoading ? (
            <Skeleton className="h-56 w-full rounded-xl cibo-skeleton" />
          ) : topFoodsData.length === 0 ? (
            <EmptyState
              title="No top foods"
              description="Your most-rescued listings will appear here."
              icon={<Sparkles className="size-5" />}
            />
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topFoodsData}
                  layout="vertical"
                  margin={{ top: 6, right: 6, left: 30, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(24,46,32,0.06)" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#1E3A28" }}
                    axisLine={false}
                    tickLine={false}
                    width={110}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid rgba(24,46,32,0.1)",
                      background: "#fff",
                      fontSize: 12,
                    }}
                    formatter={(v: any) => [v, "Rescues"]}
                  />
                  <Bar dataKey="rescues" radius={[0, 8, 8, 0]} fill={CHART_COLORS.orange} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel title="Listing status breakdown" subtitle="Where your inventory stands">
          {aQ.isLoading ? (
            <Skeleton className="h-56 w-full rounded-xl cibo-skeleton" />
          ) : statusEntries.length === 0 ? (
            <EmptyState
              title="No listings"
              description="Status breakdown will appear here once you have listings."
              icon={<BarChart3 className="size-5" />}
            />
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusEntries}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                  >
                    {statusEntries.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid rgba(24,46,32,0.1)",
                      background: "#fff",
                      fontSize: 12,
                    }}
                  />
                  <Legend
                    iconType="circle"
                    formatter={(value) => (
                      <span className="text-[11px] text-forest">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
      </div>

      {/* Insights */}
      <Panel title="Insights" subtitle="Tips to improve your rescue performance">
        <div className="grid gap-3 sm:grid-cols-3">
          <Insight
            icon={<Timer className="size-4" />}
            title="Peak rescue times"
            desc="Most rescues happen between 6-9 PM. List more food in the afternoon."
          />
          <Insight
            icon={<Clock className="size-4" />}
            title="Pickup windows"
            desc="Listings with 2-3 hour pickup windows get 35% more orders."
          />
          <Insight
            icon={<TrendingDown className="size-4" />}
            title="Pricing"
            desc="Discounts above 50% see 2× faster sell-through."
          />
        </div>
      </Panel>
    </PageShell>
  );
}

function Insight({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl bg-cream/40 p-3">
      <div className="flex items-center gap-2">
        <div className="grid size-7 place-items-center rounded-lg bg-forest text-gold">
          {icon}
        </div>
        <p className="text-xs font-bold text-forest">{title}</p>
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground">{desc}</p>
    </div>
  );
}
