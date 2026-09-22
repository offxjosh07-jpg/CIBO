"use client";

import { useQuery } from "@tanstack/react-query";
import { useApp } from "@/lib/store";
import { listingApi, catApi } from "@/lib/api-client";
import { FoodCard, FoodCardSkeleton } from "../food-card";
import { EmptyState, FoodGrid, PageShell, SectionHeader } from "./shared";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Search,
  Sparkles,
  MapPin,
  ArrowRight,
  Leaf,
  PartyPopper,
  TrendingUp,
  Clock,
  X,
} from "lucide-react";
import type { FoodCategory } from "@/lib/types";
import { useRecentlyViewed } from "@/lib/recently-viewed";
import { fmtPrice, discountPct } from "@/lib/utils";

export function HomeView() {
  const city = useApp((s) => s.city);
  const lat = useApp((s) => s.lat);
  const lng = useApp((s) => s.lng);
  const setCustomer = useApp((s) => s.setCustomer);
  const setSearch = useApp((s) => s.setSearch);

  const { data: catData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => catApi.list(),
    staleTime: 5 * 60_000,
  });

  const nearest = useQuery({
    queryKey: ["listings", "home-nearest", { city, lat, lng }],
    queryFn: () =>
      listingApi.list({ city, lat, lng, sort: "nearest", limit: 8 }),
  });

  const events = useQuery({
    queryKey: ["listings", "home-events", { city }],
    queryFn: () => listingApi.list({ isEvent: true, limit: 4, city }),
  });

  const deals = useQuery({
    queryKey: ["listings", "home-deals", { city }],
    queryFn: () => listingApi.list({ sort: "discount", limit: 4, city }),
  });

  const { items: recentItems, clear: clearRecent } = useRecentlyViewed();

  const cats = catData?.categories || [];

  return (
    <PageShell className="space-y-8">
      {/* Location header */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <MapPin className="size-3.5 text-orange" /> Available near you
        </div>
        <h1 className="font-display text-2xl font-bold text-forest sm:text-3xl">
          Good food, rescued in <span className="text-orange">{city}</span>.
        </h1>

        {/* Search */}
        <button
          onClick={() => setCustomer("search")}
          className="flex w-full items-center gap-3 rounded-2xl border border-forest/12 bg-card px-4 py-3.5 text-left text-sm text-muted-foreground transition hover:border-gold cibo-shadow"
        >
          <Search className="size-4 text-orange" />
          <span>Search biryani, pizza, cakes, providers…</span>
        </button>
      </section>

      {/* Hero */}
      <HeroCard onRescue={() => setCustomer("rescue")} onExplore={() => setCustomer("explore")} />

      {/* Categories */}
      {cats.length > 0 && (
        <section className="space-y-3">
          <SectionHeader title="Categories" subtitle="Browse by craving" />
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-cibo sm:mx-0 sm:px-0">
            {cats.map((c) => (
              <CategoryPill
                key={c.id}
                cat={c}
                onClick={() => {
                  setSearch("");
                  setCustomer("explore");
                  // stash category preference via URL-less state
                  try {
                    sessionStorage.setItem("cibo:explore:cat", c.id);
                  } catch {}
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Food rescue near you */}
      <section className="space-y-3">
        <SectionHeader
          title="Food Rescue Near You"
          subtitle="Fresh surplus ready for pickup"
          onSeeAll={() => setCustomer("rescue")}
        />
        {nearest.isLoading ? (
          <FoodGrid>
            {Array.from({ length: 4 }).map((_, i) => (
              <FoodCardSkeleton key={i} />
            ))}
          </FoodGrid>
        ) : nearest.data?.listings?.length ? (
          <FoodGrid>
            {nearest.data.listings.map((l) => (
              <FoodCard key={l.id} listing={l} />
            ))}
          </FoodGrid>
        ) : (
          <EmptyState
            title="No rescues nearby yet"
            description="Be the first to rescue food in your area. Check back soon or browse all listings."
            actionLabel="Explore all"
            onAction={() => setCustomer("explore")}
            icon={<Leaf className="size-5" />}
          />
        )}
      </section>

      {/* Event food rescue */}
      <section className="space-y-3">
        <SectionHeader
          title="Event Food Rescue"
          subtitle="Bulk surplus from weddings & events"
          onSeeAll={() => setCustomer("explore")}
        />
        {events.isLoading ? (
          <FoodGrid>
            {Array.from({ length: 2 }).map((_, i) => (
              <FoodCardSkeleton key={i} />
            ))}
          </FoodGrid>
        ) : events.data?.listings?.length ? (
          <FoodGrid>
            {events.data.listings.map((l) => (
              <FoodCard key={l.id} listing={l} />
            ))}
          </FoodGrid>
        ) : (
          <EmptyState
            title="No event rescues right now"
            description="Event surplus is posted in real time. We'll show it here as soon as it lands."
            icon={<PartyPopper className="size-5" />}
          />
        )}
      </section>

      {/* Best deals */}
      <section className="space-y-3">
        <SectionHeader
          title="Best Deals"
          subtitle="Highest discounts, limited time"
          onSeeAll={() => setCustomer("explore")}
        />
        {deals.isLoading ? (
          <FoodGrid>
            {Array.from({ length: 2 }).map((_, i) => (
              <FoodCardSkeleton key={i} />
            ))}
          </FoodGrid>
        ) : deals.data?.listings?.length ? (
          <FoodGrid>
            {deals.data.listings.map((l) => (
              <FoodCard key={l.id} listing={l} />
            ))}
          </FoodGrid>
        ) : (
          <EmptyState
            title="No active deals"
            description="New deals are added throughout the day. Check back soon!"
            icon={<TrendingUp className="size-5" />}
          />
        )}
      </section>

      {/* Recently viewed */}
      {recentItems.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-gold" />
              <h2 className="font-display text-lg font-bold text-forest sm:text-xl">
                Recently viewed
              </h2>
            </div>
            <button
              onClick={clearRecent}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition hover:text-danger"
            >
              <X className="size-3" /> Clear
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-cibo">
            {recentItems.map((item) => {
              const pct = discountPct(item.originalPrice, item.ciboPrice);
              return (
                <button
                  key={item.id}
                  onClick={() => useApp.getState().openListing(item.id)}
                  className="group flex w-44 shrink-0 flex-col overflow-hidden rounded-2xl border border-forest/8 bg-card cibo-shadow transition hover:-translate-y-0.5 hover:cibo-shadow-lg"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="size-full object-cover transition group-hover:scale-105"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/cibo-logo.svg";
                      }}
                    />
                    {pct > 0 && (
                      <span className="absolute left-2 top-2 rounded-full bg-forest px-1.5 py-0.5 text-[9px] font-extrabold text-gold">
                        {pct}% OFF
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-2.5">
                    <p className="line-clamp-1 text-xs font-bold text-forest">{item.title}</p>
                    <p className="line-clamp-1 text-[10px] text-muted-foreground">{item.providerName}</p>
                    <div className="mt-auto flex items-baseline gap-1">
                      <span className="font-display text-sm font-extrabold text-forest">{fmtPrice(item.ciboPrice)}</span>
                      <span className="text-[10px] text-muted-foreground line-through">{fmtPrice(item.originalPrice)}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* CTA strip */}
      <section className="rounded-3xl bg-forest p-6 text-ivory sm:p-8">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-xl font-bold sm:text-2xl">
              Become a CIBO rescuer.
            </h3>
            <p className="mt-1 text-sm text-ivory/80">
              Save up to 70% on great food. Reduce waste. Brighten tomorrow.
            </p>
          </div>
          <Button
            variant="rescue"
            size="lg"
            className="shrink-0"
            onClick={() => setCustomer("rescue")}
          >
            <Sparkles className="size-4" /> Start rescuing
          </Button>
        </div>
      </section>
    </PageShell>
  );
}

function HeroCard({
  onRescue,
  onExplore,
}: {
  onRescue: () => void;
  onExplore: () => void;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-3xl bg-forest p-6 text-ivory sm:p-10"
    >
      <div className="absolute inset-0 cibo-grain opacity-30" />
      <div className="absolute -right-16 -top-16 size-64 rounded-full bg-orange/30 blur-3xl" />
      <div className="absolute -bottom-20 left-10 size-64 rounded-full bg-gold/20 blur-3xl" />
      <div className="relative max-w-xl">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gold">
          <Sparkles className="size-3" /> Food Rescue Marketplace
        </span>
        <h2 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl">
          Good food deserves another chance.
        </h2>
        <p className="mt-2 text-sm text-ivory/80 sm:text-base">
          Rescue surplus food from local chefs, bakeries & events at up to 70%
          off. Same freshness. Half the price. Zero waste.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="rescue" size="lg" onClick={onRescue}>
            <Sparkles className="size-4" /> Rescue Food
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={onExplore}
            className="border-ivory/30 bg-transparent text-ivory hover:bg-ivory/10"
          >
            Explore <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </motion.section>
  );
}

function CategoryPill({ cat, onClick }: { cat: FoodCategory; onClick: () => void }) {
  // Color theme by food type
  const theme =
    cat.foodType === "VEG"
      ? "from-success/15 to-success/5 border-success/20"
      : cat.foodType === "NON_VEG"
      ? "from-danger/15 to-danger/5 border-danger/20"
      : "from-gold/15 to-cream/40 border-gold/20";
  const iconBg =
    cat.foodType === "VEG"
      ? "bg-success/15 text-success"
      : cat.foodType === "NON_VEG"
      ? "bg-danger/15 text-danger"
      : "bg-cream text-forest";

  return (
    <button
      onClick={onClick}
      className={`group relative flex w-20 shrink-0 flex-col items-center gap-2 overflow-hidden rounded-2xl border bg-gradient-to-br p-3 transition hover:-translate-y-1 hover:cibo-shadow-lg ${theme}`}
    >
      <div className={`grid size-12 place-items-center rounded-xl ${iconBg} text-2xl transition group-hover:scale-110 group-hover:rotate-3`}>
        {cat.emoji ? (
          <span aria-hidden>{cat.emoji}</span>
        ) : (
          <Leaf className="size-6" />
        )}
      </div>
      <span className="text-[11px] font-bold text-forest">{cat.name}</span>
    </button>
  );
}
