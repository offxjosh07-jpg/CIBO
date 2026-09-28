"use client";

import { useQuery } from "@tanstack/react-query";
import { useApp } from "@/lib/store";
import { useAuth } from "@/components/providers";
import { orderApi } from "@/lib/api-client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  EmptyState,
  FoodImage,
  PageShell,
  StatusPill,
} from "./shared";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClipboardList,
  Store,
  Clock,
  ArrowRight,
  LogIn,
  Leaf,
  ShoppingBag,
  TrendingDown,
  IndianRupee,
} from "lucide-react";
import { fmtPrice, fmtTime, fmtDate, timeAgo } from "@/lib/utils";
import type { Order } from "@/lib/types";

export function OrdersView() {
  const { user } = useAuth();
  const openOrder = useApp((s) => s.openOrder);

  const { data, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => orderApi.mine(),
    enabled: !!user,
  });

  const { data: statsData } = useQuery({
    queryKey: ["order-stats"],
    queryFn: () => orderApi.stats(),
    enabled: !!user,
  });
  const stats = statsData?.stats;

  if (!user) {
    return (
      <PageShell>
        <EmptyState
          title="Log in to view orders"
          description="Your past and active rescues will appear here once you log in."
          actionLabel="Log in"
          onAction={() => useApp.getState().setAuthView("login")}
          icon={<LogIn className="size-5" />}
        />
      </PageShell>
    );
  }

  const orders = data?.orders || [];
  const active = orders.filter((o) =>
    ["PLACED", "CONFIRMED", "READY", "PICKED_UP"].includes(o.status)
  );
  const completed = orders.filter((o) => o.status === "COMPLETED");
  const cancelled = orders.filter((o) =>
    ["CANCELLED", "REFUNDED"].includes(o.status)
  );

  return (
    <PageShell className="space-y-5">
      <h1 className="font-display text-2xl font-bold text-forest sm:text-3xl">
        Your orders
      </h1>

      {/* Rescue journey summary */}
      {stats && stats.totalOrders > 0 && (
        <section className="overflow-hidden rounded-3xl border border-forest/8 bg-gradient-to-br from-forest to-forest-deep p-5 text-ivory cibo-shadow">
          <div className="absolute" />
          <div className="flex items-center gap-2">
            <Leaf className="size-4 text-gold" />
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-gold">
              Your rescue journey
            </h2>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <JourneyStat
              icon={ShoppingBag}
              value={String(stats.mealsRescued)}
              label="Meals rescued"
            />
            <JourneyStat
              icon={IndianRupee}
              value={fmtPrice(stats.totalSaved)}
              label="Money saved"
            />
            <JourneyStat
              icon={Leaf}
              value={`${stats.co2AvoidedKg} kg`}
              label="CO₂ avoided"
            />
            <JourneyStat
              icon={TrendingDown}
              value={fmtPrice(stats.avgOrderValue)}
              label="Avg order"
            />
          </div>
        </section>
      )}

      <Tabs defaultValue="active">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="active">
            Active ({active.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completed.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({cancelled.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4 space-y-3">
          {isLoading ? (
            <OrderSkeletons />
          ) : active.length === 0 ? (
            <EmptyState
              title="No active rescues"
              description="When you place an order, you'll track it here in real time."
              actionLabel="Find food to rescue"
              onAction={() => useApp.getState().setCustomer("explore")}
              icon={<ClipboardList className="size-5" />}
            />
          ) : (
            active.map((o) => (
              <OrderCard key={o.id} order={o} onOpen={() => openOrder(o.id)} />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4 space-y-3">
          {isLoading ? (
            <OrderSkeletons />
          ) : completed.length === 0 ? (
            <EmptyState
              title="No completed orders yet"
              description="Completed rescues will appear here."
              icon={<ClipboardList className="size-5" />}
            />
          ) : (
            completed.map((o) => (
              <OrderCard key={o.id} order={o} onOpen={() => openOrder(o.id)} />
            ))
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="mt-4 space-y-3">
          {isLoading ? (
            <OrderSkeletons />
          ) : cancelled.length === 0 ? (
            <EmptyState
              title="No cancelled orders"
              description="Hopefully it stays that way!"
              icon={<ClipboardList className="size-5" />}
            />
          ) : (
            cancelled.map((o) => (
              <OrderCard key={o.id} order={o} onOpen={() => openOrder(o.id)} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}

function OrderCard({ order, onOpen }: { order: Order; onOpen: () => void }) {
  const items = order.items || [];
  const summary =
    items
      .slice(0, 2)
      .map((i) => i.title)
      .join(", ") + (items.length > 2 ? `, +${items.length - 2} more` : "");
  const image = items[0]?.image;

  return (
    <button
      onClick={onOpen}
      className="flex w-full items-center gap-4 rounded-2xl border border-forest/8 bg-card p-4 text-left transition hover:border-gold hover:bg-cream/40 cibo-shadow"
    >
      <div className="size-16 shrink-0 overflow-hidden rounded-xl border border-forest/10 bg-cream/40">
        <FoodImage src={image} alt={items[0]?.title || "Order"} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="font-display text-sm font-bold text-forest">
            {order.orderNumber}
          </p>
          <StatusPill status={order.status} />
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {summary || "Order"}
        </p>
        <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Store className="size-3 text-gold" />
            {order.provider?.businessName || "Provider"}
          </span>
          {order.pickupDeadline && (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3 text-gold" />
              {fmtTime(order.pickupDeadline)} · {fmtDate(order.pickupDeadline)}
            </span>
          )}
          <span>· {timeAgo(order.createdAt)}</span>
        </div>
      </div>
      <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
        <span className="font-display text-base font-extrabold text-forest">
          {fmtPrice(order.total)}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange">
          Track <ArrowRight className="size-3" />
        </span>
      </div>
    </button>
  );
}

function OrderSkeletons() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-2xl border border-forest/8 bg-card p-4"
        >
          <Skeleton className="size-16 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3 rounded" />
            <Skeleton className="h-3 w-2/3 rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function JourneyStat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Leaf;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl bg-ivory/5 p-3 backdrop-blur">
      <div className="grid size-8 place-items-center rounded-lg bg-gold/20 text-gold">
        <Icon className="size-4" />
      </div>
      <div className="mt-2 font-display text-xl font-extrabold text-ivory">
        {value}
      </div>
      <div className="text-[10px] font-medium uppercase tracking-wide text-ivory/60">
        {label}
      </div>
    </div>
  );
}
