"use client";

import { useQuery } from "@tanstack/react-query";
import { useApp } from "@/lib/store";
import { listingApi } from "@/lib/api-client";
import { FoodCard, FoodCardSkeleton } from "../food-card";
import { EmptyState, FilterChip, FoodGrid, PageShell } from "./shared";
import { motion } from "framer-motion";
import { Sparkles, Leaf, ShieldCheck, PartyPopper, TrendingUp } from "lucide-react";
import { useState } from "react";

type Chip = "all" | "veg" | "nonveg" | "halal" | "events" | "deals";

const CHIPS: { value: Chip; label: string; icon?: typeof Leaf }[] = [
  { value: "all", label: "All" },
  { value: "veg", label: "Veg", icon: Leaf },
  { value: "nonveg", label: "Non-Veg" },
  { value: "halal", label: "Halal Verified", icon: ShieldCheck },
  { value: "events", label: "Events", icon: PartyPopper },
  { value: "deals", label: "Best Deals", icon: TrendingUp },
];

export function RescueView() {
  const city = useApp((s) => s.city);
  const lat = useApp((s) => s.lat);
  const lng = useApp((s) => s.lng);
  const [chip, setChip] = useState<Chip>("all");

  const query = {
    city,
    lat,
    lng,
    sort: chip === "deals" ? "discount" : "nearest",
    foodType: chip === "veg" ? "VEG" : chip === "nonveg" ? "NON_VEG" : undefined,
    halal: chip === "halal" ? "VERIFIED" : undefined,
    isEvent: chip === "events" ? true : undefined,
    limit: 40,
  } as const;

  const { data, isLoading } = useQuery({
    queryKey: ["listings", "rescue", query],
    queryFn: () => listingApi.list(query),
  });

  const listings = data?.listings || [];

  return (
    <PageShell className="space-y-5">
      {/* Header */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-forest p-6 text-ivory"
      >
        <div className="absolute inset-0 cibo-grain opacity-30" />
        <div className="absolute -right-12 -top-12 size-48 rounded-full bg-orange/30 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-orange/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gold">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-gold" />
            </span>
            Live
          </div>
          <h1 className="mt-3 font-display text-2xl font-bold sm:text-3xl">
            Real-time food rescue near {city}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-ivory/80">
            Fresh surplus posted by local chefs, bakeries & events. Reserve
            before pickup windows close.
          </p>
        </div>
      </motion.section>

      {/* Filter chips */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-cibo sm:mx-0 sm:px-0">
        {CHIPS.map((c) => {
          const active = chip === c.value;
          const Icon = c.icon;
          return (
            <FilterChip
              key={c.value}
              active={active}
              onClick={() => setChip(c.value)}
            >
              {Icon && <Icon className="size-3" />}
              {c.label}
            </FilterChip>
          );
        })}
      </div>

      {/* Grid */}
      {isLoading ? (
        <FoodGrid>
          {Array.from({ length: 6 }).map((_, i) => (
            <FoodCardSkeleton key={i} />
          ))}
        </FoodGrid>
      ) : listings.length === 0 ? (
        <EmptyState
          title="No live rescues right now"
          description="Fresh surplus is posted throughout the day. Set a notification or check back soon."
          actionLabel="Browse all"
          onAction={() => useApp.getState().setCustomer("explore")}
          icon={<Sparkles className="size-5" />}
        />
      ) : (
        <FoodGrid>
          {listings.map((l) => (
            <FoodCard key={l.id} listing={l} />
          ))}
        </FoodGrid>
      )}
    </PageShell>
  );
}
