"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  IndianRupee,
  Wallet,
  RefreshCw,
  TrendingUp,
  Clock,
  MoreHorizontal,
  Download,
} from "lucide-react";
import { fmtPrice, fmtDateTime, cn } from "@/lib/utils";
import {
  PageShell,
  PageHeader,
  TableSkeleton,
  AdminEmptyState,
  Stat,
  PaymentStatusPill,
  downloadCsv,
} from "./shared";

export function PaymentsView() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const q = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: () => adminApi.orders(),
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [refundTarget, setRefundTarget] = useState<any | null>(null);

  // Mock refund mutation (no API for refunds; just toast + invalidate)
  const refundMut = useMutation({
    mutationFn: async (id: string) => {
      // Mock: simulate a 600ms delay
      await new Promise((r) => setTimeout(r, 600));
      return { id };
    },
    onSuccess: (_d, id) => {
      toast({
        title: "Refund initiated",
        description: `Refund for order ${id.slice(0, 8)}… has been queued (mock).`,
      });
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
  });

  const orders = q.data?.orders || [];

  // Build payment records from orders
  const payments = useMemo(() => {
    return orders.map((o: any) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      amount: o.total,
      method: o.paymentMethod,
      status: o.paymentStatus,
      ref: o.paymentRef || "—",
      date: o.createdAt,
      customer: o.customer?.name || "—",
      provider: o.provider?.businessName || "—",
    }));
  }, [orders]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return payments.filter((p) => {
      const matchSearch =
        !s ||
        p.orderNumber?.toLowerCase().includes(s) ||
        p.ref?.toLowerCase().includes(s) ||
        p.customer?.toLowerCase().includes(s);
      const matchStatus = statusFilter === "ALL" || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [payments, search, statusFilter]);

  // Summary
  const summary = useMemo(() => {
    let collected = 0;
    let platformRevenue = 0;
    let refunds = 0;
    let pending = 0;
    for (const o of orders) {
      if (o.paymentStatus === "PAID") collected += o.total;
      if (o.paymentStatus === "PENDING") pending += o.total;
      if (o.paymentStatus === "REFUNDED") refunds += o.total;
      platformRevenue += o.platformFee || 0;
    }
    return { collected, platformRevenue, refunds, pending };
  }, [orders]);

  const exportCsv = () => {
    const rows: (string | number)[][] = [
      ["Order #", "Customer", "Provider", "Amount", "Method", "Status", "Reference", "Date"],
      ...filtered.map((p) => [
        p.orderNumber,
        p.customer,
        p.provider,
        p.amount,
        p.method,
        p.status,
        p.ref,
        new Date(p.date).toISOString(),
      ]),
    ];
    downloadCsv(`cibo-payments-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    toast({ title: "CSV downloaded", description: `${filtered.length} payment records.` });
  };

  return (
    <PageShell className="space-y-5">
      <PageHeader
        title="Payments"
        subtitle={`${payments.length} payment records · derived from orders`}
        right={
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="size-4" /> Export CSV
          </Button>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Total collected"
          value={fmtPrice(summary.collected)}
          icon={<IndianRupee className="size-5" />}
          tone="success"
        />
        <Stat
          label="Platform revenue"
          value={fmtPrice(summary.platformRevenue)}
          icon={<Wallet className="size-5" />}
          tone="forest"
        />
        <Stat
          label="Refunds"
          value={fmtPrice(summary.refunds)}
          icon={<RefreshCw className="size-5" />}
          tone="danger"
        />
        <Stat
          label="Pending"
          value={fmtPrice(summary.pending)}
          icon={<Clock className="size-5" />}
          tone="gold"
        />
      </div>

      {/* Trend mock */}
      <div className="rounded-2xl border border-forest/8 bg-card p-4 cibo-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <TrendingUp className="size-3.5 text-success" /> Net revenue
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-forest">
              {fmtPrice(summary.collected - summary.refunds)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Collected minus refunds · all-time
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Avg order value
            </p>
            <p className="mt-1 font-display text-xl font-bold text-forest">
              {fmtPrice(orders.length ? summary.collected / orders.length : 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Input
            placeholder="Search by order #, customer, txn ref…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border-forest/15 bg-card pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {["ALL", "PAID", "PENDING", "REFUNDED", "FAILED"].map((s) => (
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
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-forest/8 bg-card cibo-shadow">
        {q.isLoading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : filtered.length === 0 ? (
          <AdminEmptyState
            title="No payments found"
            description="Try adjusting your search or filter."
            icon={<Wallet className="size-5" />}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-cream/40 hover:bg-cream/40">
                <TableHead className="pl-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Order #</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Customer</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Provider</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Amount</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Method</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Txn ref</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Date</TableHead>
                <TableHead className="pr-4 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id} className="text-sm">
                  <TableCell className="pl-4">
                    <span className="font-mono text-[11px] font-bold text-forest">{p.orderNumber}</span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.customer}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.provider}</TableCell>
                  <TableCell className="text-xs font-bold text-forest">{fmtPrice(p.amount)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.method}</TableCell>
                  <TableCell><PaymentStatusPill status={p.status} /></TableCell>
                  <TableCell className="text-xs">
                    <span className="font-mono text-muted-foreground">{p.ref}</span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {fmtDateTime(p.date)}
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
                        <DropdownMenuItem onClick={exportCsv}>
                          <Download className="size-3.5" /> Export row
                        </DropdownMenuItem>
                        {p.status === "PAID" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setRefundTarget(p)}
                            >
                              <RefreshCw className="size-3.5" /> Initiate refund
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Refund confirm (mock) */}
      <AlertDialog
        open={!!refundTarget}
        onOpenChange={(o) => !o && setRefundTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Initiate refund for {refundTarget?.orderNumber}?</AlertDialogTitle>
          <AlertDialogDescription>
              This will mark the payment as REFUNDED and notify the customer.
              Amount: {fmtPrice(refundTarget?.amount || 0)} (mock action — no real
              payment gateway is connected).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger text-white hover:bg-danger/90"
              onClick={() => {
                if (refundTarget) {
                  refundMut.mutate(refundTarget.id);
                  setRefundTarget(null);
                }
              }}
            >
              Issue refund
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}
