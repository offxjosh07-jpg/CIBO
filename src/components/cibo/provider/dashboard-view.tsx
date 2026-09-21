"use client";

import { useQuery } from "@tanstack/react-query";
import { useApp } from "@/lib/store";
import { providerApi, orderApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles,
  IndianRupee,
  Package,
  ClipboardList,
  Leaf,
  Star,
  PlusCircle,
  ArrowRight,
  ChefHat,
  TrendingUp,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { fmtPrice, timeAgo } from "@/lib/utils";
import { CHART_COLORS, EmptyState, PageShell, Panel, StatCard, StatSkeleton } from "./shared";

export function DashboardView() {
  const setProvider = useApp((s) => s.setProvider);
  const aQ = useQuery({
    queryKey: ["provider", "analytics"],
    queryFn: () => providerApi.analytics(),
  });
  const oQ = useQuery({
    queryKey: ["provider", "orders"],
    queryFn: () => orderApi.providerOrders(),
  });

  const a = aQ.data?.analytics;
  const orders = oQ.data?.orders || [];

  const chartData = (a?.ordersLast7Days || []).map((d: any) => ({
    date: new Date(d.date).toLocaleDateString("en-IN", { weekday: "short" }),
    orders: d.count,
    revenue: d.revenue,
  }));

  const recent = orders.slice(0, 5);

  return (
    <PageShell className="space-y-6">
      {/* Header CTA */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-forest sm:text-3xl">
            Welcome back 👋
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Here's what's happening with your rescues today.
          </p>
        </div>
        <Button variant="rescue" onClick={() => setProvider("create")}>
          <PlusCircle className="size-4" /> Create Listing
        </Button>
      </div>

      {/* Stats */}
      {aQ.isLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <StatSkeleton key={i} />
          ))}
        </div>
      ) : a ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard
            label="Today's meals"
            value={a.todaysMealsRescued}
            icon={<Sparkles className="size-5" />}
            tone="orange"
            delta={12}
          />
          <StatCard
            label="Today's revenue"
            value={fmtPrice(a.todaysRevenue)}
            icon={<IndianRupee className="size-5" />}
            tone="success"
            delta={8}
          />
          <StatCard
            label="Active listings"
            value={a.activeListings}
            icon={<Package className="size-5" />}
            tone="forest"
            delta={4}
          />
          <StatCard
            label="Today's orders"
            value={a.todaysOrders}
            icon={<ClipboardList className="size-5" />}
            tone="gold"
            delta={15}
          />
          <StatCard
            label="Waste avoided"
            value={`${Math.round(a.wasteAvoidedKg)}kg`}
            icon={<Leaf className="size-5" />}
            tone="olive"
            delta={6}
          />
          <StatCard
            label="Rating"
            value={a.rating ? a.rating.toFixed(1) : "—"}
            sub={a.rating ? `${a.totalOrders || 0} orders` : undefined}
            icon={<Star className="size-5" />}
            tone="forest"
          />
        </div>
      ) : null}

      {/* Chart + Top foods */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          title="Orders & revenue · last 7 days"
          subtitle="Track your rescue activity over the past week"
          className="lg:col-span-2"
        >
          {aQ.isLoading ? (
            <Skeleton className="h-64 w-full rounded-xl cibo-skeleton" />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 6, right: 6, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.orange} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={CHART_COLORS.orange} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
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
                    formatter={(value: any, name: any) => [
                      name === "revenue" ? fmtPrice(value as number) : value,
                      name === "revenue" ? "Revenue" : "Orders",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="orders"
                    stroke={CHART_COLORS.orange}
                    strokeWidth={2}
                    fill="url(#gOrders)"
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={CHART_COLORS.success}
                    strokeWidth={2}
                    fill="url(#gRev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel title="Top rescued foods" subtitle="Your most-loved rescues">
          {aQ.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl cibo-skeleton" />
              ))}
            </div>
          ) : a?.topFoods?.length ? (
            <ul className="space-y-2">
              {a.topFoods.slice(0, 5).map((f: any, i: number) => (
                <li
                  key={f.id}
                  className="flex items-center gap-3 rounded-xl bg-cream/30 p-2.5"
                >
                  <div className="grid size-7 place-items-center rounded-lg bg-forest text-[10px] font-bold text-gold">
                    #{i + 1}
                  </div>
                  <img
                    src={f.image || "/cibo-logo.svg"}
                    alt=""
                    className="size-9 rounded-lg object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/cibo-logo.svg";
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-forest">{f.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {f.rescues || 0} rescues · {fmtPrice(f.ciboPrice)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No top foods yet"
              description="Once customers start rescuing, your top performers will appear here."
              icon={<ChefHat className="size-5" />}
            />
          )}
        </Panel>
      </div>

      {/* Recent orders */}
      <Panel
        title="Recent orders"
        subtitle="Your latest customer rescues"
        right={
          <Button variant="ghost" size="sm" onClick={() => setProvider("orders")}>
            View all <ArrowRight className="size-3.5" />
          </Button>
        }
      >
        {oQ.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl cibo-skeleton" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <EmptyState
            title="No orders yet"
            description="When customers place orders, they'll show up here."
            actionLabel="Create a listing"
            onAction={() => setProvider("create")}
            icon={<ClipboardList className="size-5" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-forest/8 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-2 py-2">Order</th>
                  <th className="px-2 py-2">Customer</th>
                  <th className="px-2 py-2">Items</th>
                  <th className="px-2 py-2">Total</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">When</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id} className="border-b border-forest/5 last:border-0">
                    <td className="px-2 py-2.5">
                      <span className="font-mono text-[11px] font-bold text-forest">
                        {o.orderNumber}
                      </span>
                    </td>
                    <td className="px-2 py-2.5">
                      <span className="text-xs font-semibold text-forest">
                        {(o as any).customer?.name || "Customer"}
                      </span>
                    </td>
                    <td className="px-2 py-2.5">
                      <span className="text-xs text-muted-foreground">
                        {o.items.length} item{o.items.length !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="px-2 py-2.5">
                      <span className="text-xs font-bold text-forest">
                        {fmtPrice(o.total)}
                      </span>
                    </td>
                    <td className="px-2 py-2.5">
                      <StatusPill status={o.status} />
                    </td>
                    <td className="px-2 py-2.5">
                      <span className="text-[10px] text-muted-foreground">
                        {timeAgo(o.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-3">
        <QuickAction
          title="Create listing"
          desc="List new surplus food for rescue"
          icon={<PlusCircle className="size-5" />}
          onClick={() => setProvider("create")}
        />
        <QuickAction
          title="Manage orders"
          desc="Confirm, ready, and complete orders"
          icon={<ClipboardList className="size-5" />}
          onClick={() => setProvider("orders")}
        />
        <QuickAction
          title="View analytics"
          desc="See your trends and customer insights"
          icon={<TrendingUp className="size-5" />}
          onClick={() => setProvider("analytics")}
        />
      </div>
    </PageShell>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    PLACED: "bg-cream text-forest",
    CONFIRMED: "bg-gold/20 text-gold",
    READY: "bg-orange/15 text-orange",
    PICKED_UP: "bg-olive/15 text-olive",
    COMPLETED: "bg-success/15 text-success",
    CANCELLED: "bg-danger/10 text-danger",
    REFUNDED: "bg-muted text-muted-foreground",
  };
  const cls = map[status] || map.PLACED;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cls}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function QuickAction({
  title,
  desc,
  icon,
  onClick,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-3 rounded-2xl border border-forest/8 bg-card p-4 text-left transition hover:-translate-y-0.5 hover:border-gold cibo-shadow"
    >
      <div className="grid size-11 place-items-center rounded-xl bg-cream text-forest">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-forest">{title}</p>
        <p className="text-[11px] text-muted-foreground">{desc}</p>
      </div>
      <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-orange" />
    </button>
  );
}

