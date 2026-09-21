"use client";

import { useApp, useCart } from "@/lib/store";
import type { CartItem } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { FoodImage, EmptyState, PageShell, QtyStepper } from "./shared";
import { toast } from "sonner";
import { fmtPrice, fmtTime, fmtDate } from "@/lib/utils";
import {
  ShoppingCart,
  Trash2,
  ArrowRight,
  AlertTriangle,
  Store,
  Clock,
} from "lucide-react";

const PLATFORM_FEE = 5;

export function CartView() {
  const items = useCart((s) => s.items);
  const remove = useCart((s) => s.remove);
  const setQty = useCart((s) => s.setQty);
  const clear = useCart((s) => s.clear);
  const subtotal = useCart((s) => s.subtotal());
  const setCustomer = useApp((s) => s.setCustomer);

  // group by provider
  const groups = groupByProvider(items);

  // earliest pickup deadline
  const earliestDeadline = items
    .map((i) => new Date(i.pickupDeadline).getTime())
    .sort((a, b) => a - b)[0];

  const allPickup = items.every(
    (i) => i.fulfillment === "PICKUP" || i.fulfillment === "BOTH"
  );
  const deliveryFee = allPickup ? 0 : 30; // mock flat fee
  const total = subtotal + PLATFORM_FEE + deliveryFee;

  if (items.length === 0) {
    return (
      <PageShell>
        <EmptyState
          title="Your cart is empty"
          description="Browse available food rescues near you and add items to your cart."
          actionLabel="Find food to rescue"
          onAction={() => setCustomer("explore")}
          icon={<ShoppingCart className="size-5" />}
        />
      </PageShell>
    );
  }

  return (
    <PageShell className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-forest sm:text-3xl">
            Your cart
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {items.length} item{items.length === 1 ? "" : "s"} from{" "}
            {groups.length} provider{groups.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            clear();
            toast.success("Cart cleared");
          }}
          className="text-muted-foreground"
        >
          <Trash2 className="size-3.5" /> Clear
        </Button>
      </div>

      {/* Deadline warning */}
      {earliestDeadline && (
        <div className="flex items-start gap-3 rounded-2xl border border-gold/30 bg-cream/40 p-4 text-sm">
          <Clock className="mt-0.5 size-4 text-gold" />
          <div>
            <p className="font-bold text-forest">
              Pickup before {fmtTime(new Date(earliestDeadline))} ·{" "}
              {fmtDate(new Date(earliestDeadline))}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              The earliest pickup window in your cart closes soon. Complete
              checkout before this time.
            </p>
          </div>
        </div>
      )}

      {/* Multi-provider note */}
      {groups.length > 1 && (
        <div className="flex items-start gap-3 rounded-2xl border border-forest/10 bg-card p-4 text-xs">
          <AlertTriangle className="mt-0.5 size-4 text-orange" />
          <p className="text-muted-foreground">
            Your cart has items from <strong>{groups.length} providers</strong>.
            Pickup windows may differ — check each item's deadline.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Items */}
        <div className="space-y-4 lg:col-span-2">
          {groups.map((g) => (
            <section
              key={g.providerId}
              className="rounded-2xl border border-forest/8 bg-card p-4 cibo-shadow"
            >
              <div className="mb-3 flex items-center gap-2">
                <div className="grid size-8 place-items-center rounded-lg bg-forest text-ivory">
                  <Store className="size-4" />
                </div>
                <div>
                  <p className="font-display text-sm font-bold text-forest">
                    {g.providerName}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {g.items.length} item{g.items.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {g.items.map((item) => (
                  <CartLine
                    key={item.listingId}
                    item={item}
                    onRemove={() => {
                      remove(item.listingId);
                      toast.success("Removed from cart", {
                        description: item.title,
                      });
                    }}
                    onQty={(q) => setQty(item.listingId, q)}
                    onOpen={() => useApp.getState().openListing(item.listingId)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Summary */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-forest/8 bg-card p-5 cibo-shadow lg:sticky lg:top-20">
            <h3 className="font-display text-base font-bold text-forest">
              Order summary
            </h3>
            <div className="mt-4 space-y-2 text-sm">
              <Row label="Subtotal" value={fmtPrice(subtotal)} />
              <Row label="Platform fee" value={fmtPrice(PLATFORM_FEE)} />
              <Row
                label="Delivery fee"
                value={deliveryFee === 0 ? "Free" : fmtPrice(deliveryFee)}
                hint={allPickup ? "Pickup only" : undefined}
              />
              <div className="my-2 border-t border-forest/8" />
              <div className="flex items-center justify-between">
                <span className="font-display text-base font-bold text-forest">
                  Total
                </span>
                <span className="font-display text-xl font-extrabold text-forest">
                  {fmtPrice(total)}
                </span>
              </div>
            </div>

            <Button
              variant="rescue"
              size="lg"
              className="mt-4 w-full"
              onClick={() => setCustomer("checkout")}
            >
              Proceed to checkout <ArrowRight className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full"
              onClick={() => setCustomer("explore")}
            >
              Continue browsing
            </Button>
          </div>

          <div className="rounded-2xl bg-forest p-4 text-ivory">
            <p className="font-display text-sm font-bold">You're saving food 🌱</p>
            <p className="mt-1 text-xs text-ivory/80">
              Each rescue reduces waste and supports local businesses. Thank you
              for being a CIBO rescuer.
            </p>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}

function CartLine({
  item,
  onRemove,
  onQty,
  onOpen,
}: {
  item: CartItem;
  onRemove: () => void;
  onQty: (q: number) => void;
  onOpen: () => void;
}) {
  return (
    <div className="flex gap-3">
      <button
        onClick={onOpen}
        className="size-20 shrink-0 overflow-hidden rounded-xl border border-forest/10"
        aria-label={`View ${item.title}`}
      >
        <FoodImage src={item.image} alt={item.title} />
      </button>
      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <button
            onClick={onOpen}
            className="line-clamp-2 text-left text-sm font-bold text-forest hover:underline"
          >
            {item.title}
          </button>
          <button
            onClick={onRemove}
            className="shrink-0 text-muted-foreground hover:text-danger"
            aria-label={`Remove ${item.title}`}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {fmtPrice(item.price)} each · Pickup by {fmtTime(item.pickupDeadline)}
        </p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <QtyStepper
            value={item.quantity}
            min={1}
            max={item.maxQty}
            onChange={onQty}
          />
          <span className="font-display text-sm font-bold text-forest">
            {fmtPrice(item.price * item.quantity)}
          </span>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">
        {label}
        {hint && (
          <span className="ml-1 text-[10px] text-forest/60">({hint})</span>
        )}
      </span>
      <span className="font-medium text-forest">{value}</span>
    </div>
  );
}

function groupByProvider(items: CartItem[]) {
  const map = new Map<string, { providerId: string; providerName: string; items: CartItem[] }>();
  for (const item of items) {
    if (!map.has(item.providerId)) {
      map.set(item.providerId, {
        providerId: item.providerId,
        providerName: item.providerName,
        items: [],
      });
    }
    map.get(item.providerId)!.items.push(item);
  }
  return Array.from(map.values());
}
