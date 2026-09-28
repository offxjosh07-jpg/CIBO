"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listingApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "../badges";
import { toast } from "sonner";
import {
  Boxes,
  TrendingDown,
  Loader2,
  Package,
  Check,
  AlertTriangle,
} from "lucide-react";
import { cn, fmtPrice, discountPct } from "@/lib/utils";
import { EmptyState, PageShell, Panel, StatCard } from "./shared";
import type { FoodListing } from "@/lib/types";

export function InventoryView() {
  const q = useQuery({
    queryKey: ["provider", "listings"],
    queryFn: () => listingApi.mine(),
  });
  const listings = (q.data?.listings || []).filter(
    (l) => l.status !== "DRAFT" && l.status !== "TAKEN_DOWN"
  );

  const lowStock = listings.filter(
    (l) => l.quantity > 0 && l.quantity <= 5
  ).length;
  const soldOut = listings.filter((l) => l.quantity === 0).length;
  const totalUnits = listings.reduce((a, b) => a + b.quantity, 0);
  const totalSold = listings.reduce(
    (a, b) => a + (b.initialQuantity - b.quantity),
    0
  );

  return (
    <PageShell className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-forest sm:text-3xl">
          Inventory
        </h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Track stock levels. Edit quantities inline. Low stock is highlighted.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total units"
          value={totalUnits}
          icon={<Boxes className="size-5" />}
          tone="forest"
        />
        <StatCard
          label="Units sold"
          value={totalSold}
          icon={<TrendingDown className="size-5" />}
          tone="success"
        />
        <StatCard
          label="Low stock"
          value={lowStock}
          icon={<AlertTriangle className="size-5" />}
          tone="orange"
        />
        <StatCard
          label="Sold out"
          value={soldOut}
          icon={<Package className="size-5" />}
          tone="gold"
        />
      </div>

      {/* Table */}
      <Panel bodyClassName="px-0 sm:px-0">
        {q.isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl cibo-skeleton" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <EmptyState
            title="No inventory"
            description="Your active listings will appear here for stock tracking."
            icon={<Boxes className="size-5" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-forest/8 hover:bg-transparent">
                  <TableHead className="pl-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:pl-5">
                    Listing
                  </TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Initial
                  </TableHead>
                  <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Sold
                  </TableHead>
                  <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Current
                  </TableHead>
                  <TableHead className="pr-4 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:pr-5">
                    Update
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listings.map((l) => (
                  <InventoryRow key={l.id} listing={l} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Panel>
    </PageShell>
  );
}

function InventoryRow({ listing }: { listing: FoodListing }) {
  const qc = useQueryClient();
  const [qty, setQty] = useState(String(listing.quantity));
  const [editing, setEditing] = useState(false);

  const mut = useMutation({
    mutationFn: () =>
      listingApi.update(listing.id, { quantity: Number(qty) || 0 }),
    onSuccess: () => {
      toast.success("Stock updated");
      setEditing(false);
      qc.invalidateQueries({ queryKey: ["provider", "listings"] });
      qc.invalidateQueries({ queryKey: ["provider", "analytics"] });
    },
    onError: (e: any) => toast.error(e?.message || "Could not update"),
  });

  const sold = listing.initialQuantity - listing.quantity;
  const lowStock = listing.quantity > 0 && listing.quantity <= 5;
  const soldOut = listing.quantity === 0;
  const pct = discountPct(listing.originalPrice, listing.ciboPrice);

  return (
    <TableRow
      className={cn(
        "border-forest/5",
        (lowStock || soldOut) && "bg-orange/5"
      )}
    >
      <TableCell className="pl-4 sm:pl-5">
        <div className="flex items-center gap-2.5">
          <div className="size-10 shrink-0 overflow-hidden rounded-lg border border-forest/10">
            <img
              src={listing.images[0] || "/cibo-logo.svg"}
              alt=""
              className="size-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/cibo-logo.svg";
              }}
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-forest">
              {listing.title}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {fmtPrice(listing.ciboPrice)} · {pct}% off
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <StatusBadge status={listing.status} />
      </TableCell>
      <TableCell className="text-right text-xs font-semibold text-muted-foreground">
        {listing.initialQuantity}
      </TableCell>
      <TableCell className="text-right text-xs font-bold text-success">
        {sold}
      </TableCell>
      <TableCell className="text-right">
        <span
          className={cn(
            "text-xs font-extrabold",
            soldOut
              ? "text-danger"
              : lowStock
              ? "text-orange"
              : "text-forest"
          )}
        >
          {listing.quantity}
          {lowStock && !soldOut && (
            <AlertTriangle className="ml-1 inline size-3" />
          )}
        </span>
      </TableCell>
      <TableCell className="pr-4 sm:pr-5">
        <div className="flex items-center justify-end gap-1.5">
          {editing ? (
            <>
              <Input
                type="number"
                min={0}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="h-8 w-16 rounded-lg border-forest/15 text-xs"
              />
              <Button
                size="icon"
                variant="rescue"
                className="size-8"
                disabled={mut.isPending}
                onClick={() => mut.mutate()}
                aria-label="Save quantity"
              >
                {mut.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs"
              onClick={() => {
                setQty(String(listing.quantity));
                setEditing(true);
              }}
            >
              Edit
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
