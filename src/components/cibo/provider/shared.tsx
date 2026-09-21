"use client";

import { CiboMark } from "../logo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from "lucide-react";

// Provider profile extended with bank fields (the API returns them even
// though the shared type omits them).
export type ProviderProfileExt = {
  id: string;
  userId: string;
  businessName: string;
  ownerName: string;
  businessType: string;
  phone: string;
  email: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  verificationStatus:
    | "PENDING"
    | "UNDER_REVIEW"
    | "VERIFIED"
    | "REJECTED"
    | "SUSPENDED";
  licenseNumber?: string | null;
  licenseType?: string | null;
  bankName?: string | null;
  bankAccount?: string | null;
  bankIfsc?: string | null;
  upiId?: string | null;
  rating: number;
  totalRatings: number;
  totalOrders: number;
  totalRevenue: number;
  mealsRescued: number;
  wasteAvoidedKg: number;
  fulfillment: string;
  deliveryFee: number;
  bio?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
};

export type ProviderDocument = {
  id: string;
  providerId: string;
  type: string;
  url: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  createdAt: string;
};

// ---------------- Page container ----------------
export function PageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={cn("mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8", className)}
    >
      {children}
    </motion.div>
  );
}

// ---------------- Empty State ----------------
export function EmptyState({
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
  icon?: ReactNode;
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

// ---------------- Stat card ----------------
export function StatCard({
  label,
  value,
  delta,
  icon,
  tone = "forest",
  sub,
}: {
  label: string;
  value: ReactNode;
  delta?: number;
  icon: ReactNode;
  tone?: "forest" | "orange" | "gold" | "olive" | "success";
  sub?: string;
}) {
  const toneCls: Record<string, string> = {
    forest: "bg-forest text-ivory",
    orange: "bg-orange text-white",
    gold: "bg-gold text-forest-deep",
    olive: "bg-olive text-ivory",
    success: "bg-success text-white",
  };
  const up = (delta ?? 0) >= 0;
  return (
    <div className="relative overflow-hidden rounded-3xl border border-forest/8 bg-card p-5 cibo-shadow transition hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 font-display text-2xl font-extrabold text-forest sm:text-3xl">
            {value}
          </p>
          {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
        </div>
        <div
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-2xl",
            toneCls[tone]
          )}
        >
          {icon}
        </div>
      </div>
      {delta !== undefined && (
        <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-cream/60 px-2 py-0.5 text-[10px] font-bold">
          {up ? (
            <TrendingUp className="size-3 text-success" />
          ) : (
            <TrendingDown className="size-3 text-danger" />
          )}
          <span className={up ? "text-success" : "text-danger"}>
            {up ? "+" : ""}
            {delta}%
          </span>
          <span className="text-muted-foreground">vs last week</span>
        </div>
      )}
    </div>
  );
}

// ---------------- Section card ----------------
export function Panel({
  title,
  subtitle,
  right,
  className,
  bodyClassName,
  children,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-forest/8 bg-card p-5 cibo-shadow",
        className
      )}
    >
      {(title || right) && (
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            {title && (
              <h3 className="font-display text-base font-bold text-forest">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {right}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

// ---------------- Page header ----------------
export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold text-forest sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {right}
    </div>
  );
}

// ---------------- Stat skeleton ----------------
export function StatSkeleton() {
  return <Skeleton className="h-32 w-full rounded-3xl cibo-skeleton" />;
}

// ---------------- Chart colors ----------------
export const CHART_COLORS = {
  orange: "#E48F24",
  gold: "#DFAF66",
  forest: "#1E3A28",
  success: "#2F7A4A",
  olive: "#696C4D",
  danger: "#B23A2E",
  cream: "#F8E0B5",
};

// ---------------- Verification badge ----------------
export function VerificationPill({
  status,
  className,
}: {
  status: ProviderProfileExt["verificationStatus"];
  className?: string;
}) {
  const map: Record<
    ProviderProfileExt["verificationStatus"],
    { label: string; cls: string; dot: string }
  > = {
    PENDING: {
      label: "Pending",
      cls: "bg-cream/60 text-forest border border-gold/30",
      dot: "bg-gold",
    },
    UNDER_REVIEW: {
      label: "Under review",
      cls: "bg-gold/15 text-gold border border-gold/30",
      dot: "bg-gold",
    },
    VERIFIED: {
      label: "Verified",
      cls: "bg-success/10 text-success border border-success/30",
      dot: "bg-success",
    },
    REJECTED: {
      label: "Rejected",
      cls: "bg-danger/10 text-danger border border-danger/30",
      dot: "bg-danger",
    },
    SUSPENDED: {
      label: "Suspended",
      cls: "bg-danger/10 text-danger border border-danger/30",
      dot: "bg-danger",
    },
  };
  const m = map[status] || map.PENDING;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        m.cls,
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", m.dot)} />
      {m.label}
    </span>
  );
}
