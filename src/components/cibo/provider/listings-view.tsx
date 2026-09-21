"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApp } from "@/lib/store";
import { listingApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StatusBadge, DeadlineChip } from "../badges";
import { toast } from "sonner";
import { cn, fmtPrice, fmtDateTime, discountPct } from "@/lib/utils";
import {
  PlusCircle,
  Eye,
  Trash2,
  Pencil,
  Search,
  Package,
  IndianRupee,
  ShoppingCart,
} from "lucide-react";
import { EmptyState, PageShell, Panel } from "./shared";
import type { FoodListing, ListingStatus } from "@/lib/types";

type Filter = "ALL" | "ACTIVE" | "SOLD_OUT" | "EXPIRED" | "DRAFT";

export function ListingsView() {
  const setProvider = useApp((s) => s.setProvider);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");
  const [editListing, setEditListing] = useState<FoodListing | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["provider", "listings"],
    queryFn: () => listingApi.mine(),
  });
  const listings = q.data?.listings || [];

  const filtered = listings.filter((l) => {
    if (filter !== "ALL" && l.status !== filter) return false;
    if (search && !l.title.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  return (
    <PageShell className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-forest sm:text-3xl">
            Active listings
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Manage your surplus food listings.
          </p>
        </div>
        <Button variant="rescue" onClick={() => setProvider("create")}>
          <PlusCircle className="size-4" /> Create Listing
        </Button>
      </div>

      {/* Filters */}
      <Panel bodyClassName="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {(["ALL", "ACTIVE", "SOLD_OUT", "EXPIRED", "DRAFT"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition",
                filter === f
                  ? "border-forest bg-forest text-ivory"
                  : "border-forest/15 bg-card text-forest hover:border-gold hover:bg-cream/40"
              )}
            >
              {f === "ALL" ? "All" : f.replace("_", " ").toLowerCase()}
              {f !== "ALL" && (
                <span className="text-[10px] opacity-70">
                  ({listings.filter((l) => l.status === f).length})
                </span>
              )}
            </button>
          ))}
          <div className="relative ml-auto">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search listings…"
              className="h-8 w-44 rounded-full border-forest/15 bg-card pl-7 text-xs"
            />
          </div>
        </div>
      </Panel>

      {/* Listings */}
      {q.isLoading ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl cibo-skeleton" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Panel>
          <EmptyState
            title={listings.length === 0 ? "No listings yet" : "No matching listings"}
            description={
              listings.length === 0
                ? "Create your first surplus food listing to start rescuing."
                : "Try a different filter or search term."
            }
            actionLabel={listings.length === 0 ? "Create listing" : undefined}
            onAction={listings.length === 0 ? () => setProvider("create") : undefined}
            icon={<Package className="size-5" />}
          />
        </Panel>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((l) => (
            <ListingCard
              key={l.id}
              listing={l}
              onView={() => {
                useApp.getState().openListing(l.id);
              }}
              onEdit={() => setEditListing(l)}
              onDelete={() => setDeleteId(l.id)}
            />
          ))}
        </div>
      )}

      {/* Edit dialog */}
      {editListing && (
        <EditDialog
          listing={editListing}
          onClose={() => setEditListing(null)}
        />
      )}

      {/* Delete confirm */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the listing. This action cannot be
              undone. Active orders will block deletion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <DeleteAction id={deleteId!} onDone={() => setDeleteId(null)} />
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}

function ListingCard({
  listing,
  onView,
  onEdit,
  onDelete,
}: {
  listing: FoodListing;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const pct = discountPct(listing.originalPrice, listing.ciboPrice);
  return (
    <Panel bodyClassName="flex gap-3">
      <button
        onClick={onView}
        className="size-20 shrink-0 overflow-hidden rounded-xl border border-forest/10"
        aria-label="View listing"
      >
        <img
          src={listing.images[0] || "/cibo-logo.svg"}
          alt=""
          className="size-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/cibo-logo.svg";
          }}
        />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-bold text-forest">
              {listing.title}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {listing.city} · {fmtDateTime(listing.createdAt)}
            </p>
          </div>
          <StatusBadge status={listing.status} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Package className="size-3 text-gold" />
            {listing.quantity}/{listing.initialQuantity} left
          </span>
          <span className="inline-flex items-center gap-1">
            <IndianRupee className="size-3 text-success" />
            <span className="line-through">{fmtPrice(listing.originalPrice)}</span>
            <span className="font-bold text-forest">{fmtPrice(listing.ciboPrice)}</span>
            {pct > 0 && <span className="text-orange">{pct}% off</span>}
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye className="size-3 text-muted-foreground" />
            {listing.views}
          </span>
          <span className="inline-flex items-center gap-1">
            <ShoppingCart className="size-3 text-muted-foreground" />
            {listing.rescues}
          </span>
          {listing.status === "ACTIVE" && (
            <DeadlineChip deadline={listing.pickupDeadline} />
          )}
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <Button size="sm" variant="outline" onClick={onView} className="h-8">
            <Eye className="size-3.5" /> View
          </Button>
          <Button size="sm" variant="ghost" onClick={onEdit} className="h-8">
            <Pencil className="size-3.5" /> Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            className="h-8 text-danger hover:text-danger"
          >
            <Trash2 className="size-3.5" /> Delete
          </Button>
        </div>
      </div>
    </Panel>
  );
}

function EditDialog({
  listing,
  onClose,
}: {
  listing: FoodListing;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [quantity, setQuantity] = useState(String(listing.quantity));
  const [ciboPrice, setCiboPrice] = useState(String(listing.ciboPrice));
  const [status, setStatus] = useState<ListingStatus>(listing.status);

  const mut = useMutation({
    mutationFn: () =>
      listingApi.update(listing.id, {
        quantity: Number(quantity) || 0,
        ciboPrice: Number(ciboPrice) || 0,
        status,
      }),
    onSuccess: () => {
      toast.success("Listing updated");
      qc.invalidateQueries({ queryKey: ["provider", "listings"] });
      qc.invalidateQueries({ queryKey: ["provider", "analytics"] });
      onClose();
    },
    onError: (e: any) => toast.error(e?.message || "Could not update"),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit listing</DialogTitle>
          <DialogDescription>
            Quick-edit quantity, price, and status. For full edits, create a new
            listing.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-forest">Quantity</Label>
            <Input
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="h-10 rounded-xl border-forest/15"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-forest">CIBO price (₹)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={ciboPrice}
              onChange={(e) => setCiboPrice(e.target.value)}
              className="h-10 rounded-xl border-forest/15"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-forest">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ListingStatus)}>
              <SelectTrigger className="h-10 rounded-xl border-forest/15">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SOLD_OUT">Sold out</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">
              Note: ACTIVE requires a future pickup deadline.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="rescue"
            disabled={mut.isPending}
            onClick={() => mut.mutate()}
          >
            {mut.isPending ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteAction({ id, onDone }: { id: string; onDone: () => void }) {
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: () => listingApi.del(id),
    onSuccess: () => {
      toast.success("Listing deleted");
      qc.invalidateQueries({ queryKey: ["provider", "listings"] });
      onDone();
    },
    onError: (e: any) => {
      toast.error(e?.message || "Could not delete");
      onDone();
    },
  });
  return (
    <AlertDialogAction
      onClick={() => mut.mutate()}
      disabled={mut.isPending}
      className="bg-danger text-white hover:bg-danger/90"
    >
      {mut.isPending ? "Deleting…" : "Delete"}
    </AlertDialogAction>
  );
}

