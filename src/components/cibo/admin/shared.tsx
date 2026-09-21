"use client";

// Re-export shared primitives from the provider surface so the admin views
// have a consistent vocabulary with the rest of the app.
export {
  PageShell,
  Panel,
  StatCard,
  StatSkeleton,
  EmptyState,
  PageHeader,
  CHART_COLORS,
  VerificationPill,
} from "../provider/shared";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CiboMark } from "../logo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowRight,
} from "lucide-react";

// ---------------- Pills ----------------

export function OrderStatusPill({ status, className }: { status: string; className?: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PLACED: { label: "Placed", cls: "bg-cream text-forest border border-gold/30" },
    CONFIRMED: { label: "Confirmed", cls: "bg-gold/20 text-gold border border-gold/30" },
    READY: { label: "Ready", cls: "bg-orange/15 text-orange border border-orange/30" },
    PICKED_UP: { label: "Picked up", cls: "bg-olive/15 text-olive border border-olive/30" },
    COMPLETED: { label: "Completed", cls: "bg-success/15 text-success border border-success/30" },
    CANCELLED: { label: "Cancelled", cls: "bg-danger/10 text-danger border border-danger/30" },
    REFUNDED: { label: "Refunded", cls: "bg-muted text-muted-foreground border border-forest/10" },
  };
  const m = map[status] || { label: status, cls: "bg-muted text-muted-foreground" };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        m.cls,
        className
      )}
    >
      {m.label}
    </span>
  );
}

export function PaymentStatusPill({ status, className }: { status: string; className?: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PENDING: { label: "Pending", cls: "bg-gold/15 text-gold border border-gold/30" },
    PAID: { label: "Paid", cls: "bg-success/15 text-success border border-success/30" },
    REFUNDED: { label: "Refunded", cls: "bg-muted text-muted-foreground border border-forest/10" },
    FAILED: { label: "Failed", cls: "bg-danger/10 text-danger border border-danger/30" },
  };
  const m = map[status] || { label: status, cls: "bg-muted text-muted-foreground" };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        m.cls,
        className
      )}
    >
      {m.label}
    </span>
  );
}

export function ComplaintStatusPill({ status, className }: { status: string; className?: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    OPEN: { label: "Open", cls: "bg-orange/15 text-orange border border-orange/30" },
    INVESTIGATING: { label: "Investigating", cls: "bg-gold/20 text-gold border border-gold/30" },
    RESOLVED: { label: "Resolved", cls: "bg-success/15 text-success border border-success/30" },
    REJECTED: { label: "Rejected", cls: "bg-muted text-muted-foreground border border-forest/10" },
  };
  const m = map[status] || { label: status, cls: "bg-muted text-muted-foreground" };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        m.cls,
        className
      )}
    >
      {m.label}
    </span>
  );
}

export function RolePill({ role, className }: { role: string; className?: string }) {
  const map: Record<string, string> = {
    ADMIN: "bg-forest text-ivory",
    SUPPORT: "bg-olive text-ivory",
    PROVIDER: "bg-gold/20 text-gold border border-gold/30",
    CUSTOMER: "bg-cream text-forest border border-gold/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        map[role] || "bg-muted text-muted-foreground",
        className
      )}
    >
      {role}
    </span>
  );
}

// ---------------- Loading skeleton for tables ----------------

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: rows }).map((_, r) => (
        <Skeleton key={r} className="h-12 w-full rounded-xl cibo-skeleton" />
      ))}
      <div className="sr-only">{cols} columns</div>
    </div>
  );
}

// ---------------- Empty state (admin) ----------------

export function AdminEmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <CiboMark size={56} className="opacity-80 animate-float" />
      {icon && (
        <div className="mt-1 grid size-11 place-items-center rounded-2xl bg-cream/60 text-forest">
          {icon}
        </div>
      )}
      <h3 className="font-display text-lg font-bold text-forest">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button variant="rescue" size="sm" className="mt-2" onClick={onAction}>
          {actionLabel} <ArrowRight className="size-3.5" />
        </Button>
      )}
    </div>
  );
}

// ---------------- CSV export helper ----------------

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v ?? "");
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const csv = rows.map((r) => r.map(escape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------------- Section card header (small) ----------------

export function Stat({
  label,
  value,
  icon,
  tone = "forest",
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  tone?: "forest" | "orange" | "gold" | "olive" | "success" | "danger";
}) {
  const toneCls: Record<string, string> = {
    forest: "bg-forest text-ivory",
    orange: "bg-orange text-white",
    gold: "bg-gold text-forest-deep",
    olive: "bg-olive text-ivory",
    success: "bg-success text-white",
    danger: "bg-danger text-white",
  };
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-forest/8 bg-card p-3 cibo-shadow">
      <div className={cn("grid size-10 shrink-0 place-items-center rounded-xl", toneCls[tone])}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="font-display text-lg font-bold text-forest">{value}</p>
      </div>
    </div>
  );
}
