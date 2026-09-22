"use client";

import { useQuery } from "@tanstack/react-query";
import { useApp } from "@/lib/store";
import { listingApi, catApi } from "@/lib/api-client";
import type { ListingsQuery } from "@/lib/api-client";
import { FoodCard, FoodCardSkeleton } from "../food-card";
import { EmptyState, FilterChip, FoodGrid, PageShell, SectionHeader } from "./shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Search, SlidersHorizontal, Leaf, X, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export interface ExploreFilters {
  q?: string;
  foodType?: string;
  halal?: string;
  category?: string;
  sort?: string;
  radiusKm?: number;
  maxPrice?: number;
  minDiscount?: number;
  isEvent?: boolean;
  onlyDeals?: boolean;
}

export const SORT_OPTIONS = [
  { value: "nearest", label: "Nearest first" },
  { value: "price_low", label: "Price: Low → High" },
  { value: "discount", label: "Biggest discount" },
  { value: "ending_soon", label: "Ending soon" },
  { value: "recent", label: "Recently added" },
];

export const FOOD_TYPES = [
  { value: "", label: "All" },
  { value: "VEG", label: "Vegetarian" },
  { value: "NON_VEG", label: "Non-Veg" },
  { value: "EGG", label: "Egg" },
  { value: "VEGAN", label: "Vegan" },
  { value: "JAIN", label: "Jain" },
];

export function ExploreView() {
  return <ExploreLayout initialQ="" title="Explore" subtitle="Find food rescues around you" />;
}

export function ExploreLayout({
  initialQ,
  title,
  subtitle,
  fixedFilters,
  hideSearchInput,
}: {
  initialQ?: string;
  title: string;
  subtitle?: string;
  fixedFilters?: Partial<ExploreFilters>;
  hideSearchInput?: boolean;
}) {
  const city = useApp((s) => s.city);
  const lat = useApp((s) => s.lat);
  const lng = useApp((s) => s.lng);
  const setCustomer = useApp((s) => s.setCustomer);
  const setSearch = useApp((s) => s.setSearch);
  const searchQuery = useApp((s) => s.searchQuery);

  const [filters, setFilters] = useState<ExploreFilters>(() => {
    // Lazy initial state — read category hint set by HomeView, if present.
    let category: string | undefined;
    try {
      const cat = sessionStorage.getItem("cibo:explore:cat");
      if (cat) {
        category = cat;
        sessionStorage.removeItem("cibo:explore:cat");
      }
    } catch {}
    return {
      q: initialQ ?? searchQuery ?? "",
      sort: "nearest",
      radiusKm: 10,
      ...fixedFilters,
      category: fixedFilters?.category ?? category,
    };
  });
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: catData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => catApi.list(),
    staleTime: 5 * 60_000,
  });

  const apiQuery: ListingsQuery = useMemo(
    () => ({
      city,
      lat,
      lng,
      q: filters.q?.trim() || undefined,
      foodType: filters.foodType || undefined,
      halal: filters.halal || undefined,
      category: filters.category || undefined,
      sort: filters.sort || "nearest",
      radiusKm: filters.radiusKm,
      maxPrice: filters.maxPrice,
      minDiscount: filters.minDiscount,
      isEvent: filters.isEvent,
      limit: 30,
    }),
    [city, lat, lng, filters]
  );

  // Debounce the query so sliders/search don't fire on every keystroke.
  const [debouncedQuery, setDebouncedQuery] = useState(apiQuery);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(apiQuery), 350);
    return () => clearTimeout(t);
  }, [apiQuery]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["listings", "explore", debouncedQuery],
    queryFn: () => listingApi.list(debouncedQuery),
  });

  const listings = data?.listings || [];
  const total = data?.total || 0;

  const update = (patch: Partial<ExploreFilters>) =>
    setFilters((f) => ({ ...f, ...patch }));

  const clearAll = () =>
    setFilters({ q: "", sort: "nearest", radiusKm: 10, ...fixedFilters });

  const hasActiveFilters =
    !!filters.foodType ||
    !!filters.halal ||
    !!filters.category ||
    !!filters.maxPrice ||
    !!filters.minDiscount ||
    filters.radiusKm !== 10 ||
    !!filters.isEvent;

  return (
    <PageShell className="space-y-5">
      <SectionHeader title={title} subtitle={subtitle} />

      {!hideSearchInput && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={filters.q ?? ""}
            onChange={(e) => {
              update({ q: e.target.value });
              setSearch(e.target.value);
            }}
            placeholder="Search dishes, providers, cuisines…"
            className="h-12 rounded-2xl border-forest/15 bg-card pl-10 pr-10 text-sm"
          />
          {filters.q && (
            <button
              onClick={() => {
                update({ q: "" });
                setSearch("");
              }}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-forest"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-2">
        <div className="-mx-4 flex flex-1 items-center gap-2 overflow-x-auto px-4 pb-1 scrollbar-cibo sm:mx-0 sm:px-0">
          <FilterChip
            active={filters.halal === "VERIFIED"}
            onClick={() =>
              update({ halal: filters.halal === "VERIFIED" ? undefined : "VERIFIED" })
            }
          >
            <ShieldCheck className="size-3" /> Halal Verified
          </FilterChip>
          <FilterChip
            active={filters.isEvent === true}
            onClick={() => update({ isEvent: !filters.isEvent ? true : undefined })}
          >
            Events
          </FilterChip>
          <FilterChip
            active={filters.sort === "discount"}
            onClick={() =>
              update({ sort: filters.sort === "discount" ? "nearest" : "discount" })
            }
          >
            Best Deals
          </FilterChip>
          <FilterChip
            active={filters.sort === "ending_soon"}
            onClick={() =>
              update({
                sort: filters.sort === "ending_soon" ? "nearest" : "ending_soon",
              })
            }
          >
            Ending Soon
          </FilterChip>
          <FilterChip
            active={!!filters.foodType}
            onClick={() => update({ foodType: filters.foodType ? undefined : "VEG" })}
          >
            Veg only
          </FilterChip>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="shrink-0">
              <SlidersHorizontal className="size-3.5" /> Filters
              {hasActiveFilters && (
                <span className="grid size-4 place-items-center rounded-full bg-orange text-[9px] font-bold text-white">
                  !
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-sm">
            <SheetHeader>
              <SheetTitle className="font-display text-lg text-forest">
                Filters
              </SheetTitle>
            </SheetHeader>
            <FilterPanel
              filters={filters}
              update={update}
              clearAll={clearAll}
              categories={catData?.categories || []}
              onDone={() => setSheetOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Results meta */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {isLoading
            ? "Searching…"
            : `${total} rescue${total === 1 ? "" : "s"} found`}
        </span>
        <Select value={filters.sort || "nearest"} onValueChange={(v) => update({ sort: v })}>
          <SelectTrigger className="h-8 w-44 rounded-lg text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          title="No rescues match your filters"
          description="Try widening the radius, clearing filters, or check back later — fresh rescues are posted throughout the day."
          actionLabel="Clear filters"
          onAction={clearAll}
          icon={<Leaf className="size-5" />}
        />
      ) : (
        <>
          <FoodGrid className={cn(isFetching && "opacity-70 transition")}>
            {listings.map((l) => (
              <FoodCard key={l.id} listing={l} />
            ))}
          </FoodGrid>
          {total > listings.length && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" onClick={() => setCustomer("rescue")}>
                See more rescues →
              </Button>
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}

export function FilterPanel({
  filters,
  update,
  clearAll,
  categories,
  onDone,
}: {
  filters: ExploreFilters;
  update: (patch: Partial<ExploreFilters>) => void;
  clearAll: () => void;
  categories: { id: string; name: string }[];
  onDone?: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
      {/* Halal */}
      <section className="rounded-2xl border border-forest/10 bg-cream/40 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-forest" />
            <span className="text-sm font-bold text-forest">Halal verified only</span>
          </div>
          <Switch
            checked={filters.halal === "VERIFIED"}
            onCheckedChange={(v) =>
              update({ halal: v ? "VERIFIED" : undefined })
            }
            aria-label="Halal verified only"
          />
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Show only food from halal-certified or halal-verified providers.
        </p>
      </section>

      {/* Distance */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Distance
          </Label>
          <span className="text-xs font-bold text-forest">
            {filters.radiusKm ?? 10} km
          </span>
        </div>
        <Slider
          value={[filters.radiusKm ?? 10]}
          min={1}
          max={10}
          step={1}
          onValueChange={([v]) => update({ radiusKm: v })}
        />
      </section>

      {/* Food type */}
      <section className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Food type
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {FOOD_TYPES.map((ft) => (
            <button
              key={ft.value || "all"}
              onClick={() => update({ foodType: ft.value || undefined })}
              className={cn(
                "rounded-xl border px-2 py-2 text-xs font-semibold transition",
                (filters.foodType || "") === ft.value
                  ? "border-forest bg-forest text-ivory"
                  : "border-forest/15 bg-card text-forest hover:bg-cream/50"
              )}
            >
              {ft.label}
            </button>
          ))}
        </div>
      </section>

      {/* Category */}
      <section className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Category
        </Label>
        <Select
          value={filters.category || "all"}
          onValueChange={(v) => update({ category: v === "all" ? undefined : v })}
        >
          <SelectTrigger className="h-10">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      {/* Max price */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Max price
          </Label>
          <span className="text-xs font-bold text-forest">
            ₹{filters.maxPrice ?? 1000}
          </span>
        </div>
        <Slider
          value={[filters.maxPrice ?? 1000]}
          min={50}
          max={1000}
          step={50}
          onValueChange={([v]) => update({ maxPrice: v })}
        />
      </section>

      {/* Min discount */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Min discount
          </Label>
          <span className="text-xs font-bold text-forest">
            {filters.minDiscount ?? 0}%
          </span>
        </div>
        <Slider
          value={[filters.minDiscount ?? 0]}
          min={0}
          max={70}
          step={5}
          onValueChange={([v]) => update({ minDiscount: v })}
        />
      </section>

      <div className="mt-auto flex gap-2 pt-2">
        <Button variant="outline" className="flex-1" onClick={clearAll}>
          Clear all
        </Button>
        <Button variant="rescue" className="flex-1" onClick={onDone}>
          Show results
        </Button>
      </div>
    </div>
  );
}
