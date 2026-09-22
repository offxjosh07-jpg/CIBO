"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Heart, MapPin, Clock, ShoppingBag, Star, ArrowRight } from "lucide-react";
import type { FoodListing } from "@/lib/types";
import { VegBadge, HalalBadge, RescueBadge, DiscountTag, DeadlineChip } from "./badges";
import { useCart, useApp } from "@/lib/store";
import { toast } from "sonner";
import { useState } from "react";
import { discountPct } from "@/lib/utils";

function fmtPrice(n: number) {
  return `₹${Math.round(n)}`;
}

function fmtTime(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}

export function FoodCard({ listing, className }: { listing: FoodListing; className?: string }) {
  const add = useCart((s) => s.add);
  const openListing = useApp((s) => s.openListing);
  const [fav, setFav] = useState(false);
  const pct = discountPct(listing.originalPrice, listing.ciboPrice);
  const soldOut = listing.status === "SOLD_OUT" || listing.quantity <= 0;
  const expired = listing.status === "EXPIRED";
  const disabled = soldOut || expired;

  const onAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (disabled) return;
    add({
      listingId: listing.id,
      title: listing.title,
      image: listing.images[0] || "/cibo-logo.svg",
      price: listing.ciboPrice,
      quantity: 1,
      providerId: listing.providerId,
      providerName: listing.provider?.businessName || "Provider",
      pickupDeadline: listing.pickupDeadline,
      pickupStart: listing.pickupStart,
      fulfillment: listing.fulfillment,
      maxQty: listing.quantity,
    });
    toast.success("Added to cart", { description: listing.title });
  };

  return (
    <article
      onClick={() => openListing(listing.id)}
      className={cn(
        "group relative flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-forest/8 bg-card cibo-shadow transition-all hover:-translate-y-1 hover:cibo-shadow-lg",
        disabled && "opacity-75",
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={listing.images[0] || "/cibo-logo.svg"}
          alt={listing.title}
          loading="lazy"
          className={cn(
            "size-full object-cover transition-transform duration-500 group-hover:scale-105",
            disabled && "grayscale"
          )}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/55 via-transparent to-transparent" />
        {/* top row */}
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <RescueBadge />
          {listing.isEvent && (
            <span className="inline-flex items-center rounded-full bg-forest/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gold backdrop-blur">
              {listing.eventType || "Event"}
            </span>
          )}
        </div>
        {/* Hover "view details" overlay */}
        {!disabled && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center pb-3 transition-transform duration-300 group-hover:translate-y-0">
            <span className="inline-flex items-center gap-1 rounded-full bg-card/95 px-3 py-1.5 text-[11px] font-bold text-forest shadow-md backdrop-blur">
              View details <ArrowRight className="size-3 text-orange" />
            </span>
          </div>
        )}
        <button
          aria-label="Save to favorites"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setFav((f) => !f);
            toast(fav ? "Removed from favorites" : "Saved to favorites");
          }}
          className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-card/90 backdrop-blur transition hover:bg-card"
        >
          <Heart className={cn("size-4 transition", fav ? "fill-orange text-orange" : "text-forest")} />
        </button>
        {/* discount tag */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
          <DiscountTag pct={pct} />
          {listing.halalStatus === "VERIFIED" && <HalalBadge status={listing.halalStatus} />}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-1.5">
          <VegBadge type={listing.foodType as any} />
          <span className="truncate text-[11px] font-medium text-muted-foreground">
            {listing.provider?.businessName || "Provider"}
          </span>
        </div>
        <h3 className="line-clamp-1 font-display text-[15px] font-bold text-forest">
          {listing.title}
        </h3>
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {listing.description}
        </p>

        {/* meta row */}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3 text-gold" /> {listing.distanceKm.toFixed(1)} km
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3 text-gold" /> Until {fmtTime(listing.pickupDeadline)}
          </span>
          {listing.rating > 0 && (
            <span className="inline-flex items-center gap-1">
              <Star className="size-3 fill-gold text-gold" /> {listing.rating.toFixed(1)}
            </span>
          )}
        </div>

        {/* price + CTA */}
        <div className="mt-3 flex items-end justify-between border-t border-forest/8 pt-3">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-xl font-extrabold text-forest">
                {fmtPrice(listing.ciboPrice)}
              </span>
              <span className="text-xs text-muted-foreground line-through">
                {fmtPrice(listing.originalPrice)}
              </span>
            </div>
            <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {soldOut ? "Sold out" : expired ? "Pickup closed" : `${listing.quantity} left`}
            </div>
          </div>
          {disabled ? (
            <DeadlineChip deadline={listing.pickupDeadline} />
          ) : (
            <button
              onClick={onAdd}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-orange px-3 text-xs font-bold text-white transition hover:bg-orange/90 cibo-shadow-gold active:scale-95"
            >
              <ShoppingBag className="size-3.5" /> Rescue
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function FoodCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-forest/8 bg-card">
      <div className="cibo-skeleton aspect-[4/3]" />
      <div className="space-y-3 p-4">
        <div className="cibo-skeleton h-3 w-1/3 rounded" />
        <div className="cibo-skeleton h-4 w-3/4 rounded" />
        <div className="cibo-skeleton h-3 w-full rounded" />
        <div className="flex justify-between">
          <div className="cibo-skeleton h-6 w-16 rounded" />
          <div className="cibo-skeleton h-8 w-20 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
