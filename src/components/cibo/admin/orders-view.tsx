"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api-client";
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
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { MoreHorizontal, Search, Eye, ClipboardList, MapPin, Phone } from "lucide-react";
import { fmtPrice, fmtDateTime, timeAgo, cn, initials } from "@/lib/utils";
import {
  PageShell,
  PageHeader,
  AdminEmptyState,
  TableSkeleton,
  OrderStatusPill,
  PaymentStatusPill,
} from "./shared";

export function OrdersView() {
  const q = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: () => adminApi.orders(),
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [detail, setDetail] = useState<any | null>(null);

  const orders = q.data?.orders || [];

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return orders.filter((o: any) => {
      const matchSearch =
        !s ||
        o.orderNumber?.toLowerCase().includes(s) ||
        o.customer?.name?.toLowerCase().includes(s) ||
        o.provider?.businessName?.toLowerCase().includes(s);
      const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, search, statusFilter]);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = { ALL: orders.length };
    for (const o of orders) c[o.status] = (c[o.status] || 0) + 1;
    return c;
  }, [orders]);

  return (
    <PageShell className="space-y-5">
      <PageHeader
        title="Orders"
        subtitle={`${orders.length} total · ${statusCounts.COMPLETED || 0} completed · ${statusCounts.CANCELLED || 0} cancelled`}
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by order number, customer, provider…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border-forest/15 bg-card pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {["ALL", "PLACED", "CONFIRMED", "READY", "PICKED_UP", "COMPLETED", "CANCELLED", "REFUNDED"].map((s) => (
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
            title="No orders found"
            description="Try adjusting your filters."
            icon={<ClipboardList className="size-5" />}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-cream/40 hover:bg-cream/40">
                <TableHead className="pl-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Order #</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Customer</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Provider</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Items</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Payment</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Fulfillment</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Date</TableHead>
                <TableHead className="pr-4 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((o: any) => (
                <TableRow key={o.id} className="text-sm">
                  <TableCell className="pl-4">
                    <span className="font-mono text-[11px] font-bold text-forest">{o.orderNumber}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="grid size-7 place-items-center rounded-full bg-forest text-[9px] font-bold text-ivory">
                        {initials(o.customer?.name || "?")}
                      </div>
                      <span className="text-xs font-semibold text-forest">{o.customer?.name || "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {o.provider?.businessName || "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {o.items?.length || 0}
                  </TableCell>
                  <TableCell className="text-xs font-bold text-forest">{fmtPrice(o.total)}</TableCell>
                  <TableCell><OrderStatusPill status={o.status} /></TableCell>
                  <TableCell><PaymentStatusPill status={o.paymentStatus} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {o.fulfillmentType}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <span title={fmtDateTime(o.createdAt)}>{timeAgo(o.createdAt)}</span>
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Actions">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setDetail(o)}>
                          <Eye className="size-3.5" /> View details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order details</DialogTitle>
            <DialogDescription>
              {detail?.orderNumber} · placed {detail ? fmtDateTime(detail.createdAt) : ""}
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
              {/* Status row */}
              <div className="flex flex-wrap items-center gap-2">
                <OrderStatusPill status={detail.status} />
                <PaymentStatusPill status={detail.paymentStatus} />
                <span className="text-xs text-muted-foreground">
                  {detail.fulfillmentType} · {detail.paymentMethod}
                </span>
              </div>

              {/* Parties */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-forest/8 bg-card p-3 text-xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Customer</p>
                  <p className="mt-0.5 font-bold text-forest">{detail.customer?.name}</p>
                  <p className="text-muted-foreground">{detail.customer?.email}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-muted-foreground">
                    <Phone className="size-3" /> {detail.customer?.phone || "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-forest/8 bg-card p-3 text-xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Provider</p>
                  <p className="mt-0.5 font-bold text-forest">{detail.provider?.businessName}</p>
                  <p className="inline-flex items-center gap-1 text-muted-foreground">
                    <MapPin className="size-3" /> {detail.provider?.city}
                  </p>
                  <p className="text-muted-foreground">{detail.provider?.phone}</p>
                </div>
              </div>

              {/* Items */}
              <div className="rounded-xl border border-forest/8 bg-cream/30 p-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Items ({detail.items?.length || 0})
                </p>
                <ul className="space-y-2">
                  {detail.items?.map((it: any) => (
                    <li key={it.id} className="flex items-center gap-2 text-xs">
                      <img
                        src={it.image || "/cibo-logo.svg"}
                        alt=""
                        className="size-9 rounded-lg object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/cibo-logo.svg";
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-forest">{it.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {it.quantity} × {fmtPrice(it.price)}
                        </p>
                      </div>
                      <p className="font-bold text-forest">{fmtPrice(it.price * it.quantity)}</p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Totals */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Cell label="Subtotal" value={fmtPrice(detail.subtotal)} />
                <Cell label="Platform fee" value={fmtPrice(detail.platformFee)} />
                <Cell label="Delivery fee" value={fmtPrice(detail.deliveryFee)} />
                <Cell label="Discount" value={fmtPrice(detail.discount)} />
                <Cell label="Tax" value={fmtPrice(detail.tax)} />
                <Cell label="Total" value={<span className="font-bold text-forest">{fmtPrice(detail.total)}</span>} />
              </div>

              {/* OTP & addresses */}
              {detail.pickupOtp && (
                <div className="rounded-xl border border-forest/8 bg-forest p-3 text-center text-ivory">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ivory/60">
                    Pickup OTP
                  </p>
                  <p className="mt-1 font-display text-3xl font-bold tracking-[0.4em] text-gold">
                    {detail.pickupOtp}
                  </p>
                </div>
              )}
              {detail.deliveryAddress && (
                <div className="rounded-xl border border-forest/8 bg-card p-3 text-xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Delivery address
                  </p>
                  <p className="mt-0.5 text-forest">{detail.deliveryAddress}</p>
                </div>
              )}
              {detail.pickupStart && detail.pickupDeadline && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Cell label="Pickup start" value={fmtDateTime(detail.pickupStart)} />
                  <Cell label="Pickup deadline" value={fmtDateTime(detail.pickupDeadline)} />
                </div>
              )}
              {detail.notes && (
                <div className="rounded-xl border border-forest/8 bg-card p-3 text-xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Customer notes
                  </p>
                  <p className="mt-0.5 text-forest">{detail.notes}</p>
                </div>
              )}
              {detail.cancelledReason && (
                <div className="rounded-xl border border-danger/20 bg-danger/10 p-3 text-xs text-danger">
                  <p className="text-[10px] font-bold uppercase tracking-wider">Cancelled reason</p>
                  <p className="mt-0.5">{detail.cancelledReason}</p>
                </div>
              )}
              {detail.paymentRef && (
                <div className="rounded-xl border border-forest/8 bg-card p-3 text-xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Payment reference
                  </p>
                  <p className="mt-0.5 font-mono text-forest">{detail.paymentRef}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
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
