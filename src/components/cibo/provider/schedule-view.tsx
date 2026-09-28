"use client";

import { useQuery } from "@tanstack/react-query";
import { listingApi } from "@/lib/api-client";
import { useApp } from "@/lib/store";
import { PageShell, EmptyState, StatCard } from "./shared";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, Package, Users, TrendingUp } from "lucide-react";
import { fmtPrice, fmtTime, discountPct, deadlineLabel } from "@/lib/utils";
import { StatusBadge, DeadlineChip } from "../badges";
import type { FoodListing } from "@/lib/types";

export function ScheduleView() {
  const setProvider = useApp((s) => s.setProvider);

  const { data, isLoading } = useQuery({
    queryKey: ["provider", "listings", "schedule"],
    queryFn: () => listingApi.mine(),
  });

  const listings = (data?.listings || [])
    .filter((l) => l.status === "ACTIVE" || l.status === "SOLD_OUT")
    .sort(
      (a, b) =>
        new Date(a.pickupStart).getTime() - new Date(b.pickupStart).getTime()
    );

  // Group by day
  const groups: { day: string; date: Date; items: FoodListing[] }[] = [];
  for (const l of listings) {
    const d = new Date(l.pickupStart);
    const dayKey = d.toDateString();
    let g = groups.find((x) => x.date.toDateString() === dayKey);
    if (!g) {
      g = { day: dayKey, date: d, items: [] };
      groups.push(g);
    }
    g.items.push(l);
  }

  const today = new Date();
  const isToday = (d: Date) => d.toDateString() === today.toDateString();
  const isTomorrow = (d: Date) => {
    const t = new Date(today);
    t.setDate(t.getDate() + 1);
    return d.toDateString() === t.toDateString();
  };
  const dayLabel = (d: Date) => {
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });
  };

  // Stats
  const totalPickups = listings.length;
  const totalPortions = listings.reduce((s, l) => s + l.quantity, 0);
  const potentialRevenue = listings.reduce((s, l) => s + l.ciboPrice * l.quantity, 0);

  if (isLoading) {
    return (
      <PageShell className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="cibo-skeleton h-24 rounded-2xl" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="cibo-skeleton h-28 rounded-2xl" />
          ))}
        </div>
      </PageShell>
    );
  }

  if (listings.length === 0) {
    return (
      <PageShell>
        <EmptyState
          title="No upcoming pickups scheduled"
          description="Create a listing with a future pickup window to see your weekly schedule here."
          actionLabel="Create listing"
          onAction={() => setProvider("create")}
          icon={<Calendar className="size-5" />}
        />
      </PageShell>
    );
  }

  return (
    <PageShell className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          icon={<Calendar className="size-5" />}
          label="Scheduled pickups"
          value={String(totalPickups)}
          tone="orange"
        />
        <StatCard
          icon={<Package className="size-5" />}
          label="Total portions"
          value={String(totalPortions)}
          tone="gold"
        />
        <StatCard
          icon={<TrendingUp className="size-5" />}
          label="Potential revenue"
          value={fmtPrice(potentialRevenue)}
          tone="success"
        />
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {groups.map((g, gi) => {
          const portions = g.items.reduce((s, l) => s + l.quantity, 0);
          const revenue = g.items.reduce((s, l) => s + l.ciboPrice * l.quantity, 0);
          return (
            <motion.div
              key={g.day}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: gi * 0.05 }}
              className="space-y-3"
            >
              {/* Day header */}
              <div className="flex items-center gap-3">
                <div
                  className={`grid size-12 shrink-0 place-items-center rounded-2xl ${
                    isToday(g.date)
                      ? "bg-orange text-white cibo-shadow-gold"
                      : "bg-cream text-forest"
                  }`}
                >
                  <div className="text-center leading-none">
                    <div className="text-[9px] font-bold uppercase">
                      {g.date.toLocaleDateString("en-IN", { weekday: "short" })}
                    </div>
                    <div className="font-display text-lg font-extrabold">
                      {g.date.getDate()}
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-lg font-bold text-forest">
                    {dayLabel(g.date)}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {g.items.length} pickup{g.items.length !== 1 ? "s" : ""} · {portions} portions · {fmtPrice(revenue)} potential
                  </p>
                </div>
              </div>

              {/* Pickup cards */}
              <div className="space-y-2 border-l-2 border-gold/30 pl-4 ml-6">
                {g.items.map((l) => {
                  const pct = discountPct(l.originalPrice, l.ciboPrice);
                  return (
                    <div
                      key={l.id}
                      className="flex flex-col gap-3 rounded-2xl border border-forest/8 bg-card p-4 cibo-shadow transition hover:border-gold/30 sm:flex-row sm:items-center"
                    >
                      {/* Time block */}
                      <div className="flex shrink-0 items-center gap-2 sm:w-32 sm:flex-col sm:items-start">
                        <div className="grid size-9 place-items-center rounded-xl bg-forest text-gold">
                          <Clock className="size-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-forest">
                            {fmtTime(l.pickupStart)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            to {fmtTime(l.pickupDeadline)}
                          </p>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-display text-sm font-bold text-forest">
                            {l.title}
                          </h4>
                          <StatusBadge status={l.status} />
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Package className="size-3 text-gold" />
                            {l.quantity} portions
                          </span>
                          <span className="font-bold text-forest">
                            {fmtPrice(l.ciboPrice)}
                            {pct > 0 && <span className="ml-1 text-orange">{pct}% off</span>}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3 text-muted-foreground" />
                            {l.city}
                          </span>
                          {l.isEvent && (
                            <span className="rounded-full bg-forest/10 px-2 py-0.5 text-[9px] font-bold uppercase text-forest">
                              {l.eventType || "Event"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Deadline */}
                      <div className="shrink-0">
                        <DeadlineChip deadline={l.pickupDeadline} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </PageShell>
  );
}
