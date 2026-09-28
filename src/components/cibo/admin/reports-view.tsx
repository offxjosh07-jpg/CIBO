"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Download, Calendar, FileBarChart } from "lucide-react";
import { fmtPrice, cn } from "@/lib/utils";
import { PageShell, PageHeader, Stat, downloadCsv } from "./shared";

type RangeKey = "7" | "30" | "90" | "all";

export function ReportsView() {
  const { toast } = useToast();
  const ovQ = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => adminApi.overview(),
  });
  const ordersQ = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: () => adminApi.orders(),
  });
  const complaintsQ = useQuery({
    queryKey: ["admin", "complaints"],
    queryFn: () => adminApi.complaints(),
  });
  const [range, setRange] = useState<RangeKey>("30");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const ov = ovQ.data?.overview;
  const orders = ordersQ.data?.orders || [];
  const complaints = complaintsQ.data?.complaints || [];

  const cutoff = useMemo(() => {
    if (range === "all") return 0;
    const days = parseInt(range, 10);
    return Date.now() - days * 86400000;
  }, [range]);

  const scopedOrders = useMemo(() => {
    let list = orders;
    if (from) list = list.filter((o: any) => new Date(o.createdAt).getTime() >= new Date(from).getTime());
    if (to) list = list.filter((o: any) => new Date(o.createdAt).getTime() <= new Date(to).getTime() + 86400000);
    if (cutoff) list = list.filter((o: any) => new Date(o.createdAt).getTime() >= cutoff);
    return list;
  }, [orders, from, to, cutoff]);

  const scopedComplaints = useMemo(() => {
    let list = complaints;
    if (from) list = list.filter((c: any) => new Date(c.createdAt).getTime() >= new Date(from).getTime());
    if (to) list = list.filter((c: any) => new Date(c.createdAt).getTime() <= new Date(to).getTime() + 86400000);
    if (cutoff) list = list.filter((c: any) => new Date(c.createdAt).getTime() >= cutoff);
    return list;
  }, [complaints, from, to, cutoff]);

  // Summary metrics
  const summary = useMemo(() => {
    let gmv = 0;
    let revenue = 0;
    let meals = 0;
    let completed = 0;
    let cancelled = 0;
    for (const o of scopedOrders) {
      if (o.status === "CANCELLED") cancelled++;
      if (o.status === "COMPLETED") {
        completed++;
        meals += o.items.reduce((a: number, b: any) => a + b.quantity, 0);
      }
      if (o.status !== "CANCELLED") {
        gmv += o.total;
        revenue += o.platformFee || 0;
      }
    }
    return {
      orders: scopedOrders.length,
      gmv,
      revenue,
      meals,
      completed,
      cancelled,
      complaints: scopedComplaints.length,
    };
  }, [scopedOrders, scopedComplaints]);

  const generateReport = (
    type: "orders" | "revenue" | "meals" | "complaints"
  ) => {
    const stamp = new Date().toISOString().slice(0, 10);
    let rows: (string | number)[][] = [];
    let filename = "";
    if (type === "orders") {
      filename = `cibo-orders-${stamp}.csv`;
      rows = [
        ["Order #", "Customer", "Provider", "Items", "Total", "Status", "Payment", "Date"],
        ...scopedOrders.map((o: any) => [
          o.orderNumber,
          o.customer?.name || "",
          o.provider?.businessName || "",
          o.items?.length || 0,
          o.total,
          o.status,
          o.paymentStatus,
          new Date(o.createdAt).toISOString(),
        ]),
      ];
    } else if (type === "revenue") {
      filename = `cibo-revenue-${stamp}.csv`;
      rows = [
        ["Order #", "Subtotal", "Platform fee", "Delivery fee", "Tax", "Discount", "Total", "Payment status", "Date"],
        ...scopedOrders.map((o: any) => [
          o.orderNumber,
          o.subtotal,
          o.platformFee,
          o.deliveryFee,
          o.tax,
          o.discount,
          o.total,
          o.paymentStatus,
          new Date(o.createdAt).toISOString(),
        ]),
      ];
    } else if (type === "meals") {
      filename = `cibo-meals-rescued-${stamp}.csv`;
      rows = [
        ["Order #", "Item", "Quantity", "Price", "Date"],
        ...scopedOrders.flatMap((o: any) =>
          (o.items || []).map((it: any) => [
            o.orderNumber,
            it.title,
            it.quantity,
            it.price,
            new Date(o.createdAt).toISOString(),
          ])
        ),
      ];
    } else {
      filename = `cibo-complaints-${stamp}.csv`;
      rows = [
        ["Type", "Customer", "Provider", "Order #", "Status", "Description", "Filed"],
        ...scopedComplaints.map((c: any) => [
          c.type,
          c.user?.name || "",
          c.provider?.businessName || "",
          c.order?.orderNumber || "",
          c.status,
          c.description,
          new Date(c.createdAt).toISOString(),
        ]),
      ];
    }
    downloadCsv(filename, rows);
    toast({
      title: "Report generated",
      description: `${filename} (${rows.length - 1} records) downloaded.`,
    });
  };

  return (
    <PageShell className="space-y-5">
      <PageHeader
        title="Reports"
        subtitle="Generate downloadable CSV reports across orders, revenue, meals rescued, and complaints."
      />

      {/* Date range selector */}
      <div className="rounded-2xl border border-forest/8 bg-card p-4 cibo-shadow">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Preset range
            </Label>
            <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
              <SelectTrigger className="w-44 rounded-xl border-forest/15 bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="from" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              From
            </Label>
            <Input
              id="from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-xl border-forest/15 bg-card"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="to" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              To
            </Label>
            <Input
              id="to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-xl border-forest/15 bg-card"
            />
          </div>
          {(from || to) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFrom("");
                setTo("");
              }}
            >
              Clear dates
            </Button>
          )}
          <div className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-cream/40 px-3 py-1.5 text-xs font-semibold text-forest">
            <Calendar className="size-3.5" />
            {summary.orders} orders in range
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Orders in range"
          value={summary.orders}
          icon={<FileText className="size-5" />}
          tone="forest"
        />
        <Stat
          label="GMV"
          value={fmtPrice(summary.gmv)}
          icon={<FileBarChart className="size-5" />}
          tone="success"
        />
        <Stat
          label="Platform revenue"
          value={fmtPrice(summary.revenue)}
          icon={<FileBarChart className="size-5" />}
          tone="gold"
        />
        <Stat
          label="Meals rescued"
          value={summary.meals}
          icon={<FileBarChart className="size-5" />}
          tone="orange"
        />
      </div>

      {/* Report cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ReportCard
          title="Daily orders"
          description={`${summary.orders} orders · ${summary.completed} completed · ${summary.cancelled} cancelled`}
          onClick={() => generateReport("orders")}
        />
        <ReportCard
          title="Revenue"
          description={`${fmtPrice(summary.gmv)} GMV · ${fmtPrice(summary.revenue)} commission`}
          onClick={() => generateReport("revenue")}
        />
        <ReportCard
          title="Meals rescued"
          description={`${summary.meals} meals · ${fmtPrice(summary.gmv)} GMV`}
          onClick={() => generateReport("meals")}
        />
        <ReportCard
          title="Complaints"
          description={`${summary.complaints} complaints filed in range`}
          onClick={() => generateReport("complaints")}
        />
      </div>

      {/* Overview peek */}
      {ov && (
        <div className="rounded-2xl border border-forest/8 bg-card p-4 cibo-shadow">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            All-time platform totals
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <MiniStat label="Users" value={ov.totalUsers} />
            <MiniStat label="Providers" value={ov.providers} />
            <MiniStat label="Verified" value={ov.verifiedProviders} />
            <MiniStat label="Open complaints" value={ov.openComplaints} />
          </div>
        </div>
      )}
    </PageShell>
  );
}

function ReportCard({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex flex-col gap-2 rounded-2xl border border-forest/8 bg-card p-4 text-left cibo-shadow transition",
        "hover:-translate-y-0.5 hover:border-gold"
      )}
    >
      <div className="grid size-10 place-items-center rounded-xl bg-forest text-ivory">
        <FileText className="size-5" />
      </div>
      <div>
        <p className="font-display text-base font-bold text-forest">{title}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{description}</p>
      </div>
      <span className="mt-auto inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-orange">
        <Download className="size-3.5" /> Generate CSV
      </span>
    </button>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-cream/30 p-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 font-display text-lg font-bold text-forest">
        {value.toLocaleString("en-IN")}
      </p>
    </div>
  );
}
