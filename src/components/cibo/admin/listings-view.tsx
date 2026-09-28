"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { StatusBadge } from "../badges";
import { MoreHorizontal, Search, Eye, Ban, Package } from "lucide-react";
import { fmtPrice, fmtDate, fmtDateTime, discountPct, cn } from "@/lib/utils";
import { PageShell, PageHeader, AdminEmptyState, TableSkeleton } from "./shared";

export function ListingsView() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const q = useQuery({
    queryKey: ["admin", "listings"],
    queryFn: () => adminApi.listings(),
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [detail, setDetail] = useState<any | null>(null);
  const [takedownTarget, setTakedownTarget] = useState<any | null>(null);

  const takedownMut = useMutation({
    mutationFn: (id: string) => adminApi.takedownListing(id),
    onSuccess: () => {
      toast({
        title: "Listing taken down",
        description: "The listing is no longer visible to customers.",
      });
      qc.invalidateQueries({ queryKey: ["admin", "listings"] });
    },
    onError: (e: any) =>
      toast({
        title: "Action failed",
        description: e?.message || "Please try again.",
        variant: "destructive",
      }),
  });

  const listings = q.data?.listings || [];

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return listings.filter((l: any) => {
      const matchSearch =
        !s ||
        l.title?.toLowerCase().includes(s) ||
        l.provider?.businessName?.toLowerCase().includes(s) ||
        l.city?.toLowerCase().includes(s);
      const matchStatus = statusFilter === "ALL" || l.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [listings, search, statusFilter]);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = { ALL: listings.length };
    for (const l of listings) c[l.status] = (c[l.status] || 0) + 1;
    return c;
  }, [listings]);

  return (
    <PageShell className="space-y-5">
      <PageHeader
        title="Listings"
        subtitle={`${listings.length} total · ${statusCounts.ACTIVE || 0} active · ${statusCounts.EXPIRED || 0} expired · ${statusCounts.TAKEN_DOWN || 0} taken down`}
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title, provider, city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border-forest/15 bg-card pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {["ALL", "ACTIVE", "SOLD_OUT", "EXPIRED", "DRAFT", "TAKEN_DOWN"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                statusFilter === s
                  ? "bg-forest text-ivory"
                  : "bg-card text-forest/70 border border-forest/15 hover:bg-cream/60"
              )}
            >
              {s === "ALL" ? "All" : s.replace("_", " ").toLowerCase()}
              <span className="ml-1 opacity-70">{statusCounts[s] || 0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-forest/8 bg-card cibo-shadow">
        {q.isLoading ? (
          <TableSkeleton rows={8} cols={8} />
        ) : filtered.length === 0 ? (
          <AdminEmptyState
            title="No listings found"
            description="Try adjusting your search or status filter."
            icon={<Package className="size-5" />}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-cream/40 hover:bg-cream/40">
                <TableHead className="pl-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Listing</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Provider</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Qty</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Price</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Pickup deadline</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">City</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Created</TableHead>
                <TableHead className="pr-4 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l: any) => {
                const expired =
                  l.status === "EXPIRED" ||
                  (l.status === "ACTIVE" && new Date(l.pickupDeadline).getTime() < Date.now());
                return (
                  <TableRow key={l.id} className={cn("text-sm", expired && "bg-danger/5")}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={l.images?.[0] || "/cibo-logo.svg"}
                          alt=""
                          className="size-10 shrink-0 rounded-lg object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/cibo-logo.svg";
                          }}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-forest">{l.title}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {l.foodType} · {l.fulfillment}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {l.provider?.businessName || "—"}
                    </TableCell>
                    <TableCell><StatusBadge status={l.status} /></TableCell>
                    <TableCell className="text-xs">
                      <span className={cn("font-semibold", l.quantity === 0 ? "text-danger" : "text-forest")}>
                        {l.quantity}/{l.initialQuantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-forest">{fmtPrice(l.ciboPrice)}</span>
                        {l.originalPrice > l.ciboPrice && (
                          <span className="text-[10px] text-muted-foreground line-through">
                            {fmtPrice(l.originalPrice)}
                          </span>
                        )}
                        {l.originalPrice > l.ciboPrice && (
                          <span className="rounded bg-orange/15 px-1 text-[9px] font-bold text-orange">
                            -{discountPct(l.originalPrice, l.ciboPrice)}%
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className={cn(expired ? "font-bold text-danger" : "text-muted-foreground")}>
                        {fmtDateTime(l.pickupDeadline)}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{l.city}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmtDate(l.createdAt)}</TableCell>
                    <TableCell className="pr-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Actions">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setDetail(l)}>
                            <Eye className="size-3.5" /> View listing
                          </DropdownMenuItem>
                          {l.status !== "TAKEN_DOWN" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setTakedownTarget(l)}
                              >
                                <Ban className="size-3.5" /> Take down
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Listing details</DialogTitle>
            <DialogDescription>
              Admin view of the food listing.
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
              <div className="flex gap-3">
                <img
                  src={detail.images?.[0] || "/cibo-logo.svg"}
                  alt=""
                  className="size-24 shrink-0 rounded-2xl object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/cibo-logo.svg";
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={detail.status} />
                    {detail.originalPrice > detail.ciboPrice && (
                      <span className="rounded bg-orange/15 px-1.5 py-0.5 text-[10px] font-bold text-orange">
                        -{discountPct(detail.originalPrice, detail.ciboPrice)}% OFF
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 font-display text-lg font-bold text-forest">{detail.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {detail.provider?.businessName} · {detail.city}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <Cell label="CIBO price" value={fmtPrice(detail.ciboPrice)} />
                <Cell label="Original price" value={fmtPrice(detail.originalPrice)} />
                <Cell label="Quantity" value={`${detail.quantity}/${detail.initialQuantity}`} />
              </div>

              <div className="rounded-xl border border-forest/8 bg-cream/30 p-3 text-xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Description</p>
                <p className="mt-1 text-forest">{detail.description || "—"}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <Cell label="Pickup start" value={fmtDateTime(detail.pickupStart)} />
                <Cell label="Pickup deadline" value={fmtDateTime(detail.pickupDeadline)} />
                <Cell label="Food type" value={detail.foodType} />
                <Cell label="Halal status" value={detail.halalStatus} />
                <Cell label="Fulfillment" value={detail.fulfillment} />
                <Cell label="Delivery fee" value={fmtPrice(detail.deliveryFee || 0)} />
              </div>

              {(detail.allergens?.length > 0 || detail.storageInfo || detail.packagingInfo || detail.specialInstructions) && (
                <div className="space-y-2 rounded-xl border border-forest/8 bg-card p-3 text-xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Food safety
                  </p>
                  {detail.allergens?.length > 0 && (
                    <p className="text-forest"><b>Allergens:</b> {detail.allergens.join(", ")}</p>
                  )}
                  {detail.storageInfo && (
                    <p className="text-forest"><b>Storage:</b> {detail.storageInfo}</p>
                  )}
                  {detail.packagingInfo && (
                    <p className="text-forest"><b>Packaging:</b> {detail.packagingInfo}</p>
                  )}
                  {detail.specialInstructions && (
                    <p className="text-forest"><b>Special:</b> {detail.specialInstructions}</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 text-xs">
                <Cell label="Views" value={detail.views || 0} />
                <Cell label="Rescues" value={detail.rescues || 0} />
                <Cell label="Rating" value={detail.rating?.toFixed(1) || "—"} />
              </div>

              {detail.status !== "TAKEN_DOWN" && (
                <div className="border-t border-forest/8 pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-danger/30 text-danger hover:bg-danger/10"
                    onClick={() => {
                      setTakedownTarget(detail);
                      setDetail(null);
                    }}
                  >
                    <Ban className="size-4" /> Take down listing
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Takedown confirm */}
      <AlertDialog
        open={!!takedownTarget}
        onOpenChange={(o) => !o && setTakedownTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Take down this listing?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{takedownTarget?.title}&quot; will be marked as TAKEN_DOWN and
              hidden from customers immediately. The provider will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger text-white hover:bg-danger/90"
              onClick={() => {
                if (takedownTarget) {
                  takedownMut.mutate(takedownTarget.id);
                  setTakedownTarget(null);
                }
              }}
            >
              Take down
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}

function Cell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-forest/8 bg-card p-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 truncate text-forest">{value}</p>
    </div>
  );
}
