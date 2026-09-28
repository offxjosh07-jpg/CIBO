"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
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
import { TrendingUp, IndianRupee, Star, RefreshCw, MapPin, Calendar } from "lucide-react";
import { fmtPrice, cn } from "@/lib/utils";
import {
  PageShell,
  PageHeader,
  Panel,
  StatCard,
  StatSkeleton,
  CHART_COLORS,
} from "./shared";

export function AnalyticsView() {
  const ovQ = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => adminApi.overview(),
  });
  const ordersQ = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: () => adminApi.orders(),
  });

  const ov = ovQ.data?.overview;
  const orders = ordersQ.data?.orders || [];

  // 7-day chart data
  const chartData = (ov?.ordersLast7Days || []).map((d: any, i: number) => {
    const rev = ov?.revenueLast7Days?.[i]?.revenue || 0;
    return {
      date: new Date(d.date).toLocaleDateString("en-IN", { weekday: "short" }),
      orders: d.count,
      revenue: rev,
      gmv: d.count ? rev * 8 : 0, // mock GMV proxy
      meals: Math.round(d.count * 1.4), // mock meals proxy
    };
  });

  // Orders by status
  const statusData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const o of orders) {
      map[o.status] = (map[o.status] || 0) + 1;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [orders]);

  // Orders by city
  const cityData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const o of orders) {
      const city = (o as any).provider?.city || "Unknown";
      map[city] = (map[city] || 0) + 1;
    }
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [orders]);

  // KPIs
  const kpis = useMemo(() => {
    const validOrders = orders.filter((o: any) => o.status !== "CANCELLED");
    const totalGMV = validOrders.reduce((s, o) => s + o.total, 0);
    const totalDiscount = orders.reduce((s, o) => s + (o.discount || 0), 0);
    const totalSubtotal = orders.reduce((s, o) => s + (o.subtotal || 0), 0);
    const refunds = orders.filter((o: any) => o.paymentStatus === "REFUNDED").length;
    const cancelled = orders.filter((o: any) => o.status === "CANCELLED").length;
    const avgOrder = validOrders.length ? totalGMV / validOrders.length : 0;
    const avgDiscount = totalSubtotal ? (totalDiscount / totalSubtotal) * 100 : 0;
    const refundRate = orders.length ? (refunds / orders.length) * 100 : 0;
    const cancellationRate = orders.length ? (cancelled / orders.length) * 100 : 0;
    return { avgOrder, avgDiscount, refundRate, cancellationRate };
  }, [orders]);

  // Top cities (KPI)
  const topCities = useMemo(() => {
    return cityData.slice(0, 3).map((c) => c.name);
  }, [cityData]);

  // Peak day
  const peakDay = useMemo(() => {
    if (chartData.length === 0) return "—";
    const peak = chartData.reduce((a, b) => (b.orders > a.orders ? b : a), chartData[0]);
    return peak.date;
  }, [chartData]);

  const statusColors = [
    CHART_COLORS.orange,
    CHART_COLORS.success,
    CHART_COLORS.gold,
    CHART_COLORS.olive,
    CHART_COLORS.danger,
    CHART_COLORS.forest,
    "#C77C1B",
  ];

  return (
    <PageShell className="space-y-5">
      <PageHeader
        title="Analytics"
        subtitle="Platform trends, mix, and operational KPIs."
      />

      {/* KPI cards */}
      {ovQ.isLoading || ordersQ.isLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Avg order value"
            value={fmtPrice(kpis.avgOrder)}
            icon={<IndianRupee className="size-5" />}
            tone="forest"
            delta={6}
          />
          <StatCard
            label="Avg discount"
            value={`${kpis.avgDiscount.toFixed(1)}%`}
            icon={<TrendingUp className="size-5" />}
            tone="orange"
            delta={2}
          />
          <StatCard
            label="Refund rate"
            value={`${kpis.refundRate.toFixed(1)}%`}
            icon={<RefreshCw className="size-5" />}
            tone="gold"
            delta={-1}
          />
          <StatCard
            label="Cancellation rate"
            value={`${kpis.cancellationRate.toFixed(1)}%`}
            icon={<Star className="size-5" />}
            tone="olive"
            delta={-1}
          />
        </div>
      )}

      {/* Insights row */}
      <div className="grid gap-3 sm:grid-cols-3">
        <InsightCard
          title="Top cities"
          icon={<MapPin className="size-4 text-gold" />}
          body={
            topCities.length ? (
              <ol className="space-y-1 text-xs">
                {topCities.map((c, i) => (
                  <li key={c} className="flex items-center justify-between text-forest">
                    <span className="font-semibold">
                      #{i + 1} {c}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-xs text-muted-foreground">No data yet</p>
            )
          }
        />
        <InsightCard
          title="Peak day (7d)"
          icon={<Calendar className="size-4 text-gold" />}
          body={
            <p className="font-display text-2xl font-bold text-forest">{peakDay}</p>
          }
        />
        <InsightCard
          title="Today's GMV"
          icon={<IndianRupee className="size-4 text-gold" />}
          body={
            <p className="font-display text-2xl font-bold text-forest">
              {fmtPrice(ov?.todaysGMV || 0)}
            </p>
          }
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="GMV trend · 7 days" subtitle="Daily gross merchandise value (mock proxy)">
          {ovQ.isLoading ? (
            <Skeleton className="h-64 w-full rounded-xl cibo-skeleton" />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 6, right: 6, left: -10, bottom: 0 }}>
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
                    formatter={(v: any) => [fmtPrice(v as number), "GMV"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="gmv"
                    stroke={CHART_COLORS.orange}
                    strokeWidth={3}
                    dot={{ r: 3, fill: CHART_COLORS.orange }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel title="Revenue trend · 7 days" subtitle="Daily platform commission">
          {ovQ.isLoading ? (
            <Skeleton className="h-64 w-full rounded-xl cibo-skeleton" />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 6, right: 6, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gAdmRev" x1="0" y1="0" x2="0" y2="1">
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
                    labelStyle={{ fontWeight: 700, color: "#1E3A28" }}
                    formatter={(v: any) => [fmtPrice(v as number), "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={CHART_COLORS.success}
                    strokeWidth={2}
                    fill="url(#gAdmRev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Orders by city" subtitle="Top cities by volume" className="lg:col-span-2">
          {ordersQ.isLoading ? (
            <Skeleton className="h-64 w-full rounded-xl cibo-skeleton" />
          ) : cityData.length ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cityData} layout="vertical" margin={{ top: 6, right: 12, left: 30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(24,46,32,0.06)" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                    width={80}
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
                  <Bar
                    dataKey="value"
                    fill={CHART_COLORS.orange}
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-12 text-center text-xs text-muted-foreground">No order data yet</p>
          )}
        </Panel>

        <Panel title="Orders by status" subtitle="Distribution mix">
          {ordersQ.isLoading ? (
            <Skeleton className="h-64 w-full rounded-xl cibo-skeleton" />
          ) : statusData.length ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={statusColors[i % statusColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid rgba(24,46,32,0.1)",
                      background: "#fff",
                      fontSize: 12,
                    }}
                    labelStyle={{ fontWeight: 700, color: "#1E3A28" }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: 10 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-12 text-center text-xs text-muted-foreground">No order data yet</p>
          )}
        </Panel>
      </div>

      {/* Charts row 3 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Meals rescued trend · 7 days" subtitle="Daily rescued meals (mock proxy)">
          {ovQ.isLoading ? (
            <Skeleton className="h-64 w-full rounded-xl cibo-skeleton" />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 6, right: 6, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gAdmMeals" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.olive} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={CHART_COLORS.olive} stopOpacity={0} />
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
                    dataKey="meals"
                    stroke={CHART_COLORS.olive}
                    strokeWidth={2}
                    fill="url(#gAdmMeals)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel title="Complaints trend · 7 days" subtitle="Mock proxy from order volume">
          {ovQ.isLoading ? (
            <Skeleton className="h-64 w-full rounded-xl cibo-skeleton" />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 6, right: 6, left: -10, bottom: 0 }}>
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
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke={CHART_COLORS.danger}
                    strokeWidth={2}
                    dot={{ r: 3, fill: CHART_COLORS.danger }}
                    name="Volume proxy"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
      </div>
    </PageShell>
  );
}

function InsightCard({
  title,
  icon,
  body,
}: {
  title: string;
  icon: React.ReactNode;
  body: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-2xl border border-forest/8 bg-card p-4 cibo-shadow")}>
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {icon} {title}
      </p>
      <div className="mt-2">{body}</div>
    </div>
  );
}
