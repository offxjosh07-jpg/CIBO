"use client";

import { useQuery } from "@tanstack/react-query";
import { useApp } from "@/lib/store";
import { providerApi, orderApi } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Wallet,
  IndianRupee,
  TrendingUp,
  Clock,
  Banknote,
  ArrowDownToLine,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
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

const COMMISSION_PCT = 0.10;

export function EarningsView() {
  const aQ = useQuery({
    queryKey: ["provider", "analytics"],
    queryFn: () => providerApi.analytics(),
  });
  const oQ = useQuery({
    queryKey: ["provider", "orders"],
    queryFn: () => orderApi.providerOrders(),
  });

  const a = aQ.data?.analytics;
  const orders = (oQ.data?.orders || []).filter(
    (o) => o.status === "COMPLETED"
  );

  const grossRevenue = a?.totalRevenue ?? 0;
  const commission = grossRevenue * COMMISSION_PCT;
  const netEarnings = grossRevenue - commission;
  const pendingPayouts = Math.max(0, netEarnings * 0.2);

  // Earnings by listing (computed from completed orders' items)
  const byListing = new Map<string, { title: string; revenue: number; rescues: number }>();
  for (const o of orders) {
    for (const it of o.items) {
      const key = it.listingId || it.title;
      const prev = byListing.get(key) || {
        title: it.title,
        revenue: 0,
        rescues: 0,
      };
      prev.revenue += it.price * it.quantity;
      prev.rescues += it.quantity;
      byListing.set(key, prev);
    }
  }
  const listingRows = Array.from(byListing.values()).sort(
    (a, b) => b.revenue - a.revenue
  );

  // Payment method breakdown (from completed orders)
  const paymentMethods = ["UPI", "CARD", "NETBANKING", "WALLET"];
  const methodLabels: Record<string, string> = {
    UPI: "UPI",
    CARD: "Card",
    NETBANKING: "Net Banking",
    WALLET: "Wallet",
  };
  const methodColors: Record<string, string> = {
    UPI: "#E48F24",
    CARD: "#182E20",
    NETBANKING: "#DFAF66",
    WALLET: "#2F7A4A",
  };
  const byMethod = new Map<string, { count: number; revenue: number }>();
  for (const pm of paymentMethods) byMethod.set(pm, { count: 0, revenue: 0 });
  for (const o of orders) {
    const m = o.paymentMethod;
    if (byMethod.has(m)) {
      const prev = byMethod.get(m)!;
      prev.count++;
      prev.revenue += o.subtotal;
    }
  }
  const methodRows = Array.from(byMethod.entries())
    .map(([method, v]) => ({ method, ...v, label: methodLabels[method] || method }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.revenue - a.revenue);
  const totalMethodRevenue = methodRows.reduce((s, r) => s + r.revenue, 0) || 1;

  // Last 7 days earnings bar chart
  const chartData = (a?.ordersLast7Days || []).map((d: any) => ({
    date: new Date(d.date).toLocaleDateString("en-IN", { weekday: "short" }),
    revenue: Math.round(d.revenue * (1 - COMMISSION_PCT)),
  }));

  // This month earnings (mock from last 7 days x ~4)
  const thisMonth = chartData.reduce((s, d) => s + d.revenue, 0) * 4;

  return (
    <PageShell className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-forest sm:text-3xl">
          Earnings
        </h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Track your revenue, commission, and payouts.
        </p>
      </div>

      {/* Stats */}
      {aQ.isLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Gross revenue"
            value={fmtPrice(grossRevenue)}
            icon={<IndianRupee className="size-5" />}
            tone="forest"
            delta={12}
          />
          <StatCard
            label="Platform commission"
            value={`-${fmtPrice(commission)}`}
            sub={`${Math.round(COMMISSION_PCT * 100)}% of gross`}
            icon={<ArrowDownToLine className="size-5" />}
            tone="orange"
          />
          <StatCard
            label="Net earnings"
            value={fmtPrice(netEarnings)}
            icon={<Wallet className="size-5" />}
            tone="success"
            delta={10}
          />
          <StatCard
            label="This month (est.)"
            value={fmtPrice(thisMonth)}
            sub="Projected"
            icon={<TrendingUp className="size-5" />}
            tone="gold"
          />
        </div>
      )}

      {/* Pending payouts */}
      <Panel title="Payout status" subtitle="Funds owed to your bank/UPI account">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-cream/40 p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Clock className="size-3.5 text-orange" /> Pending payout
            </div>
            <p className="mt-1 font-display text-2xl font-extrabold text-forest">
              {fmtPrice(pendingPayouts)}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Settled to your bank account within 3-5 business days.
            </p>
          </div>
          <div className="rounded-2xl bg-success/10 p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-success">
              <Banknote className="size-3.5" /> Lifetime paid out
            </div>
            <p className="mt-1 font-display text-2xl font-extrabold text-success">
              {fmtPrice(Math.max(0, netEarnings - pendingPayouts))}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Already settled to your account.
            </p>
          </div>
        </div>
      </Panel>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Daily earnings · last 7 days" subtitle="Net of commission">
          {aQ.isLoading ? (
            <Skeleton className="h-56 w-full rounded-xl cibo-skeleton" />
          ) : (
            <div className="h-56 w-full">
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
                    formatter={(v: any) => [fmtPrice(v as number), "Net earnings"]}
                  />
                  <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={
                          i === chartData.length - 1
                            ? CHART_COLORS.orange
                            : CHART_COLORS.success
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel title="Earnings by listing" subtitle="Top-performing rescues">
          {oQ.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl cibo-skeleton" />
              ))}
            </div>
          ) : listingRows.length === 0 ? (
            <EmptyState
              title="No earnings yet"
              description="Once orders are completed, per-listing revenue will appear here."
              icon={<Wallet className="size-5" />}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-forest/8 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="px-2 py-2">Listing</th>
                    <th className="px-2 py-2 text-right">Rescues</th>
                    <th className="px-2 py-2 text-right">Revenue</th>
                    <th className="px-2 py-2 text-right">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {listingRows.slice(0, 8).map((r, i) => (
                    <tr key={i} className="border-b border-forest/5 last:border-0">
                      <td className="px-2 py-2">
                        <p className="truncate text-xs font-semibold text-forest">
                          {r.title}
                        </p>
                      </td>
                      <td className="px-2 py-2 text-right text-xs text-muted-foreground">
                        {r.rescues}
                      </td>
                      <td className="px-2 py-2 text-right text-xs font-bold text-forest">
                        {fmtPrice(r.revenue)}
                      </td>
                      <td className="px-2 py-2 text-right text-xs font-bold text-success">
                        {fmtPrice(r.revenue * (1 - COMMISSION_PCT))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      {/* Payment method breakdown */}
      <Panel title="Revenue by payment method" subtitle="How customers are paying you">
        {methodRows.length === 0 ? (
          <EmptyState
            title="No payment data yet"
            description="Completed orders will show payment method breakdown here."
            icon={<Wallet className="size-5" />}
          />
        ) : (
          <div className="space-y-3">
            {methodRows.map((r) => {
              const pct = Math.round((r.revenue / totalMethodRevenue) * 100);
              const color = methodColors[r.method] || "#696C4D";
              return (
                <div key={r.method}>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full" style={{ background: color }} />
                      <span className="font-semibold text-forest">{r.label}</span>
                      <span className="text-[11px] text-muted-foreground">
                        · {r.count} order{r.count !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-forest">{fmtPrice(r.revenue)}</span>
                      <span className="ml-1.5 text-[11px] text-muted-foreground">{pct}%</span>
                    </div>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <Panel title="Payout details" subtitle="Where we send your money">
        <p className="text-xs text-muted-foreground">
          Update your bank/UPI details on the{" "}
          <button
            onClick={() => useApp.getState().setProvider("profile")}
            className="font-bold text-orange hover:underline"
          >
            profile page
          </button>
          . Payouts are processed every Monday.
        </p>
      </Panel>
    </PageShell>
  );
}

