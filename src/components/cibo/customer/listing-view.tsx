"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApp, useCart } from "@/lib/store";
import { listingApi, complaintApi, favApi, reviewApi } from "@/lib/api-client";
import {
  VegBadge,
  HalalBadge,
  RescueBadge,
  DiscountTag,
  DeadlineChip,
  StatusBadge,
} from "../badges";
import { FoodCard, FoodCardSkeleton } from "../food-card";
import { FoodImage, EmptyState, FoodGrid, PageShell, QtyStepper } from "./shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft,
  Heart,
  ShoppingBag,
  Star,
  MapPin,
  Clock,
  ShieldCheck,
  Truck,
  Store,
  AlertTriangle,
  PackageCheck,
} from "lucide-react";
import {
  cn,
  fmtPrice,
  fmtTime,
  discountPct,
  deadlineLabel,
} from "@/lib/utils";
import { useState } from "react";
import type { FoodListing } from "@/lib/types";

export function ListingView() {
  const id = useApp((s) => s.activeListingId);
  const setCustomer = useApp((s) => s.setCustomer);
  const lat = useApp((s) => s.lat);
  const lng = useApp((s) => s.lng);
  const add = useCart((s) => s.add);
  const qc = useQueryClient();

  const [qty, setQty] = useState(1);
  const [reportOpen, setReportOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["listing", id, lat, lng],
    queryFn: () => listingApi.get(id!),
    enabled: !!id,
  });

  const { data: safetyData } = useQuery({
    queryKey: ["listing-safety", id],
    queryFn: () => listingApi.safety(id!),
    enabled: !!id,
  });

  const { data: favData } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => favApi.list(),
  });
  const isFav = favData?.favorites?.some(
    (f) => f.listingId === id && f.listing
  );

  const toggleFav = useMutation({
    mutationFn: () => favApi.toggle(id!),
    onSuccess: (r) => {
      toast.success(r.fav ? "Saved to favorites" : "Removed from favorites");
      qc.invalidateQueries({ queryKey: ["favorites"] });
    },
    onError: () => toast.error("Could not update favorites"),
  });

  const listing = data?.listing;

  // Related listings
  const { data: relatedData, isLoading: relatedLoading } = useQuery({
    queryKey: ["listings", "related", listing?.categoryId, listing?.id],
    queryFn: () =>
      listingApi.list({
        category: listing?.categoryId || undefined,
        city: listing?.city,
        lat,
        lng,
        limit: 4,
      }),
    enabled: !!listing?.id,
  });
  const related = (relatedData?.listings || []).filter(
    (l) => l.id !== listing?.id
  );

  // Provider reviews
  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ["reviews", listing?.providerId],
    queryFn: () => reviewApi.list(listing!.providerId, 5),
    enabled: !!listing?.providerId,
  });
  const reviews = reviewsData?.reviews || [];
  const reviewSummary = reviewsData?.summary;

  if (isLoading) return <ListingSkeleton onBack={() => setCustomer("home")} />;
  if (isError || !listing)
    return (
      <PageShell>
        <Button
          variant="ghost"
          size="sm"
          className="mb-3"
          onClick={() => setCustomer("home")}
        >
          <ArrowLeft className="size-4" /> Back
        </Button>
        <EmptyState
          title="Listing not found"
          description="This rescue may have been removed or sold out."
          actionLabel="Browse more"
          onAction={() => setCustomer("explore")}
          icon={<AlertTriangle className="size-5" />}
        />
      </PageShell>
    );

  const pct = discountPct(listing.originalPrice, listing.ciboPrice);
  const soldOut = listing.status === "SOLD_OUT" || listing.quantity <= 0;
  const expired = listing.status === "EXPIRED";
  const disabled = soldOut || expired;
  const maxQty = Math.max(1, Math.min(listing.quantity, 99));
  const images = listing.images?.length ? listing.images : [];

  const onAdd = () => {
    if (disabled) return;
    add({
      listingId: listing.id,
      title: listing.title,
      image: images[0] || "/cibo-logo.svg",
      price: listing.ciboPrice,
      quantity: qty,
      providerId: listing.providerId,
      providerName: listing.provider?.businessName || "Provider",
      pickupDeadline: listing.pickupDeadline,
      pickupStart: listing.pickupStart,
      fulfillment: listing.fulfillment,
      maxQty: listing.quantity,
    });
    toast.success("Added to cart", {
      description: `${qty} × ${listing.title}`,
    });
    setCustomer("cart");
  };

  return (
    <PageShell className="space-y-6">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 w-fit"
        onClick={() => setCustomer("explore")}
      >
        <ArrowLeft className="size-4" /> Back to listings
      </Button>

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
        {/* Image gallery */}
        <div className="space-y-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-forest/8 bg-card cibo-shadow">
            <FoodImage src={images[0]} alt={listing.title} />
            <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/40 via-transparent to-transparent" />
            <div className="absolute left-3 top-3 flex items-center gap-1.5">
              <RescueBadge />
              {listing.isEvent && (
                <span className="inline-flex items-center rounded-full bg-forest/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gold">
                  {listing.eventType || "Event"}
                </span>
              )}
            </div>
            <button
              aria-label={isFav ? "Remove from favorites" : "Save to favorites"}
              onClick={() => toggleFav.mutate()}
              className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-card/90 backdrop-blur transition hover:bg-card"
            >
              <Heart
                className={cn(
                  "size-4 transition",
                  isFav ? "fill-orange text-orange" : "text-forest"
                )}
              />
            </button>
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
              <DiscountTag pct={pct} />
              <StatusBadge status={listing.status} />
            </div>
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-cibo">
              {images.map((img, i) => (
                <div
                  key={i}
                  className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-xl border border-forest/10"
                >
                  <FoodImage src={img} alt={`${listing.title} ${i + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <VegBadge type={listing.foodType as any} />
              <HalalBadge status={listing.halalStatus} />
              {listing.isEvent && (
                <span className="inline-flex items-center rounded-full bg-forest px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-gold">
                  {listing.eventType || "Event"} Rescue
                </span>
              )}
            </div>
            <h1 className="font-display text-2xl font-bold leading-tight text-forest sm:text-3xl">
              {listing.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Star className="size-3 fill-gold text-gold" />
                {listing.rating > 0 ? listing.rating.toFixed(1) : "New"}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3 text-gold" />
                {listing.distanceKm.toFixed(1)} km · {listing.city}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3 text-gold" />
                Until {fmtTime(listing.pickupDeadline)}
              </span>
              <span className="inline-flex items-center gap-1">
                <ShoppingBag className="size-3 text-gold" />
                {listing.rescues} rescued
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="rounded-2xl border border-forest/8 bg-card p-4 cibo-shadow">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-3xl font-extrabold text-forest">
                    {fmtPrice(listing.ciboPrice)}
                  </span>
                  <span className="text-sm text-muted-foreground line-through">
                    {fmtPrice(listing.originalPrice)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-orange">
                  You save {fmtPrice(listing.originalPrice - listing.ciboPrice)}{" "}
                  ({pct}% off)
                </p>
              </div>
              <DeadlineChip deadline={listing.pickupDeadline} />
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Qty
              </Label>
              <QtyStepper
                value={qty}
                min={1}
                max={maxQty}
                onChange={setQty}
              />
              <span className="text-xs text-muted-foreground">
                {listing.quantity} left
              </span>
            </div>

            <Button
              variant="rescue"
              size="lg"
              className="mt-4 w-full"
              disabled={disabled}
              onClick={onAdd}
            >
              <ShoppingBag className="size-4" />
              {disabled
                ? soldOut
                  ? "Sold out"
                  : "Pickup closed"
                : `Add to cart · ${fmtPrice(listing.ciboPrice * qty)}`}
            </Button>
            {disabled && (
              <p className="mt-2 text-center text-[11px] text-danger">
                This rescue is no longer available for booking.
              </p>
            )}
          </div>

          {/* Description */}
          <section className="space-y-2">
            <h3 className="font-display text-base font-bold text-forest">
              About this rescue
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {listing.description}
            </p>
            {listing.specialInstructions && (
              <div className="rounded-xl border border-gold/30 bg-cream/40 p-3 text-xs text-forest">
                <span className="font-bold">Special instructions: </span>
                {listing.specialInstructions}
              </div>
            )}
          </section>

          {/* Fulfillment */}
          <section className="grid grid-cols-2 gap-2">
            <FulfillmentTile
              active={
                listing.fulfillment === "PICKUP" ||
                listing.fulfillment === "BOTH"
              }
              icon={<Store className="size-4" />}
              label="Pickup"
              hint={fmtTime(listing.pickupStart) + " – " + fmtTime(listing.pickupDeadline)}
            />
            <FulfillmentTile
              active={
                listing.fulfillment === "DELIVERY" ||
                listing.fulfillment === "BOTH"
              }
              icon={<Truck className="size-4" />}
              label="Delivery"
              hint={
                listing.deliveryFee > 0
                  ? `+ ${fmtPrice(listing.deliveryFee)}`
                  : "Free"
              }
            />
          </section>
        </div>
      </div>

      {/* Pickup + provider + safety */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Pickup */}
        <section className="rounded-2xl border border-forest/8 bg-card p-5 cibo-shadow">
          <h3 className="flex items-center gap-2 font-display text-base font-bold text-forest">
            <MapPin className="size-4 text-orange" /> Pickup details
          </h3>
          <div className="mt-3 space-y-2 text-sm">
            <div>
              <span className="text-xs text-muted-foreground">Address</span>
              <p className="font-medium text-forest">{listing.addressLine}</p>
              <p className="text-xs text-muted-foreground">{listing.city}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Pickup window</span>
              <p className="font-medium text-forest">
                {fmtTime(listing.pickupStart)} – {fmtTime(listing.pickupDeadline)}
              </p>
              <p className="text-xs text-gold">
                {deadlineLabel(listing.pickupDeadline)}
              </p>
            </div>
          </div>
          <div className="mt-3 aspect-video overflow-hidden rounded-xl bg-cream/40 grid place-items-center">
            <MapPin className="size-6 text-gold" />
          </div>
        </section>

        {/* Provider */}
        <section className="rounded-2xl border border-forest/8 bg-card p-5 cibo-shadow">
          <h3 className="flex items-center gap-2 font-display text-base font-bold text-forest">
            <Store className="size-4 text-orange" /> Provider
          </h3>
          {listing.provider ? (
            <div className="mt-3 space-y-3">
              <div className="flex items-center gap-3">
                <div className="grid size-12 place-items-center rounded-xl bg-forest text-ivory font-display text-sm font-bold">
                  {(listing.provider.businessName || "P")
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
                <div>
                  <p className="font-display text-sm font-bold text-forest">
                    {listing.provider.businessName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {listing.provider.businessType} · {listing.provider.city}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Star className="size-3 fill-gold text-gold" />
                  {listing.provider.rating.toFixed(1)} (
                  {listing.provider.totalRatings})
                </span>
                <span>·</span>
                <span>{listing.provider.totalOrders} orders</span>
              </div>
              {listing.provider.verificationStatus === "VERIFIED" && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-success">
                  <ShieldCheck className="size-3" /> Verified provider
                </div>
              )}
              <p className="text-xs leading-relaxed text-muted-foreground">
                {listing.provider.bio || "A trusted CIBO food rescue partner."}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              Provider information unavailable.
            </p>
          )}
        </section>

        {/* Food safety */}
        <section className="rounded-2xl border border-forest/8 bg-card p-5 cibo-shadow">
          <h3 className="flex items-center gap-2 font-display text-base font-bold text-forest">
            <ShieldCheck className="size-4 text-orange" /> Food safety
          </h3>
          <div className="mt-3 space-y-2 text-xs">
            <SafetyRow
              label="Prep time"
              value={listing.prepTime || safetyData?.report?.prepTime || "—"}
            />
            <SafetyRow
              label="Packing time"
              value={listing.packingTime || safetyData?.report?.packingTime || "—"}
            />
            <SafetyRow
              label="Storage"
              value={listing.storageInfo || safetyData?.report?.storageInfo || "—"}
            />
            <SafetyRow
              label="Packaging"
              value={
                listing.packagingInfo ||
                safetyData?.report?.packagingInfo ||
                "—"
              }
            />
            <SafetyRow
              label="Halal status"
              value={
                listing.halalStatus === "VERIFIED"
                  ? "Verified halal"
                  : listing.halalStatus === "DECLARED"
                  ? "Provider declared"
                  : "Not specified"
              }
            />
            <div className="pt-1">
              <span className="text-muted-foreground">Allergens</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {listing.allergens?.length ? (
                  listing.allergens.map((a) => (
                    <span
                      key={a}
                      className="inline-flex items-center rounded-md bg-cream px-1.5 py-0.5 text-[10px] font-semibold text-forest"
                    >
                      {a}
                    </span>
                  ))
                ) : (
                  <span className="text-muted-foreground">None declared</span>
                )}
              </div>
            </div>
            {safetyData?.report?.safetyDeclaration && (
              <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-success/10 px-2 py-1.5 text-[11px] font-semibold text-success">
                <PackageCheck className="size-3" /> Safety declaration on file
              </div>
            )}
            {safetyData?.report?.handlingDeclaration && (
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                {safetyData.report.handlingDeclaration}
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Allergens strip */}
      {listing.allergens?.length > 0 && (
        <section className="rounded-2xl border border-danger/20 bg-danger/5 p-4">
          <h3 className="flex items-center gap-2 font-display text-sm font-bold text-danger">
            <AlertTriangle className="size-4" /> Allergen information
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Contains: {listing.allergens.join(", ")}. Please inform the provider
            of any severe allergies before pickup.
          </p>
        </section>
      )}

      {/* Report problem */}
      <div className="flex justify-center">
        <ReportDialog
          open={reportOpen}
          onOpenChange={setReportOpen}
          listing={listing}
        />
      </div>

      {/* Provider reviews */}
      {listing.providerId && (
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-display text-xl font-bold text-forest">
              <Star className="size-4 fill-gold text-gold" /> Provider reviews
            </h3>
            {reviewSummary && reviewSummary.count > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-display text-2xl font-bold text-forest">
                  {reviewSummary.average.toFixed(1)}
                </span>
                <span className="text-muted-foreground">
                  · {reviewSummary.count} review{reviewSummary.count !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
          {reviewsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="cibo-skeleton h-20 rounded-2xl" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-2xl border border-forest/8 bg-card p-6 text-center text-sm text-muted-foreground">
              No reviews yet. Be the first to review after completing an order!
            </div>
          ) : (
            <>
              {/* Rating distribution bar */}
              {reviewSummary && reviewSummary.count > 0 && (
                <div className="rounded-2xl border border-forest/8 bg-card p-4">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="font-display text-4xl font-extrabold text-forest">
                        {reviewSummary.average.toFixed(1)}
                      </div>
                      <div className="mt-1 flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={cn(
                              "size-3",
                              s <= Math.round(reviewSummary.average)
                                ? "fill-gold text-gold"
                                : "text-muted/40"
                            )}
                          />
                        ))}
                      </div>
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        {reviewSummary.count} total
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const c = reviewSummary.distribution[star] || 0;
                        const pct = reviewSummary.count > 0 ? (c / reviewSummary.count) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-2 text-[11px]">
                            <span className="w-3 text-muted-foreground">{star}</span>
                            <Star className="size-2.5 fill-gold text-gold" />
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-gold transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-6 text-right text-muted-foreground">{c}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              {/* Review cards */}
              <div className="space-y-2">
                {reviews.map((r: any) => (
                  <div
                    key={r.id}
                    className="rounded-2xl border border-forest/8 bg-card p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="grid size-9 place-items-center rounded-full bg-cream font-bold text-forest text-sm">
                          {r.user?.name?.[0] || "A"}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-forest">{r.user?.name || "Anonymous"}</p>
                          <div className="mt-0.5 flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={cn(
                                  "size-3",
                                  s <= r.rating ? "fill-gold text-gold" : "text-muted/40"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    {r.comment && (
                      <p className="mt-2.5 text-sm leading-relaxed text-forest/80">
                        "{r.comment}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section className="space-y-3 pt-2">
          <h3 className="font-display text-xl font-bold text-forest">
            More rescues you may like
          </h3>
          {relatedLoading ? (
            <FoodGrid>
              {Array.from({ length: 4 }).map((_, i) => (
                <FoodCardSkeleton key={i} />
              ))}
            </FoodGrid>
          ) : (
            <FoodGrid>
              {related.map((l) => (
                <FoodCard key={l.id} listing={l} />
              ))}
            </FoodGrid>
          )}
        </section>
      )}
    </PageShell>
  );
}

function FulfillmentTile({
  active,
  icon,
  label,
  hint,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-3 transition",
        active
          ? "border-forest/15 bg-card cibo-shadow"
          : "border-forest/8 bg-muted opacity-60"
      )}
    >
      <div className="flex items-center gap-2 text-forest">
        {icon}
        <span className="text-sm font-bold">{label}</span>
      </div>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}

function SafetyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-forest">{value}</span>
    </div>
  );
}

function ReportDialog({
  open,
  onOpenChange,
  listing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  listing: FoodListing;
}) {
  const [type, setType] = useState("FOOD_QUALITY");
  const [desc, setDesc] = useState("");
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: () =>
      complaintApi.create({
        listingId: listing.id,
        providerId: listing.providerId,
        type,
        description: desc,
      }),
    onSuccess: () => {
      toast.success("Report submitted. Our team will investigate.");
      setDesc("");
      onOpenChange(false);
      qc.invalidateQueries({ queryKey: ["complaints"] });
    },
    onError: () => toast.error("Could not submit report"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <AlertTriangle className="size-3.5" /> Report a problem
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report a problem</DialogTitle>
          <DialogDescription>
            Tell us what went wrong with this rescue. Our team will review and
            follow up.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Issue type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FOOD_QUALITY">Food quality</SelectItem>
                <SelectItem value="SAFETY">Food safety concern</SelectItem>
                <SelectItem value="PICKUP">Pickup issue</SelectItem>
                <SelectItem value="LISTING_INACCURATE">
                  Listing inaccurate
                </SelectItem>
                <SelectItem value="PROVIDER">Provider behavior</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Describe what happened…"
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="rescue"
            disabled={!desc.trim() || mut.isPending}
            onClick={() => mut.mutate()}
          >
            {mut.isPending ? "Submitting…" : "Submit report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ListingSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <PageShell className="space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2 w-fit" onClick={onBack}>
        <ArrowLeft className="size-4" /> Back
      </Button>
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
        <Skeleton className="aspect-[4/3] w-full rounded-3xl" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-2/3 rounded-lg" />
          <Skeleton className="h-4 w-1/2 rounded" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    </PageShell>
  );
}
