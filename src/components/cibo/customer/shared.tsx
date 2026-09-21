"use client";

import { CiboMark } from "../logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

export const CITIES = ["Tirunelveli", "Nagercoil", "Madurai", "Chennai"] as const;
export const COORDS: Record<string, [number, number]> = {
  Tirunelveli: [8.7139, 77.7567],
  Nagercoil: [8.168, 77.4324],
  Madurai: [9.9252, 78.1198],
  Chennai: [13.0827, 80.2707],
};

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
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <CiboMark size={64} className="opacity-80 animate-float" />
      <div className="mt-2 grid size-12 place-items-center rounded-2xl bg-cream/60 text-forest">
        {icon}
      </div>
      <h3 className="font-display text-lg font-bold text-forest">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button variant="rescue" size="sm" className="mt-2" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

// ---------------- Section Header ----------------
export function SectionHeader({
  title,
  subtitle,
  onSeeAll,
  className,
}: {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-end justify-between gap-3 px-1",
        className
      )}
    >
      <div>
        <h2 className="font-display text-xl font-bold text-forest sm:text-2xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {onSeeAll && (
        <button
          onClick={onSeeAll}
          className="shrink-0 text-xs font-semibold text-orange hover:underline"
        >
          See all →
        </button>
      )}
    </div>
  );
}

// ---------------- Food grid ----------------
export function FoodGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4",
        className
      )}
    >
      {children}
    </div>
  );
}

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
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}
    >
      {children}
    </motion.div>
  );
}

// ---------------- Filter chip ----------------
export function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition",
        active
          ? "border-forest bg-forest text-ivory cibo-shadow"
          : "border-forest/15 bg-card text-forest hover:border-gold hover:bg-cream/60"
      )}
    >
      {children}
    </button>
  );
}

// ---------------- Status pill ----------------
export function StatusPill({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const map: Record<string, string> = {
    PLACED: "bg-cream text-forest",
    CONFIRMED: "bg-gold/20 text-gold",
    READY: "bg-orange/15 text-orange",
    PICKED_UP: "bg-olive/15 text-olive",
    COMPLETED: "bg-success/15 text-success",
    CANCELLED: "bg-danger/10 text-danger",
    REFUNDED: "bg-muted text-muted-foreground",
  };
  const cls = map[status] || map.PLACED;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        cls,
        className
      )}
    >
      {status.replace("_", " ")}
    </span>
  );
}

// ---------------- Quantity stepper ----------------
export function QtyStepper({
  value,
  min = 1,
  max = 99,
  onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-forest/15 bg-card p-1">
      <button
        aria-label="Decrease quantity"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="grid size-8 place-items-center rounded-lg bg-cream/60 text-forest transition hover:bg-cream disabled:opacity-40"
        disabled={value <= min}
      >
        −
      </button>
      <span className="min-w-6 text-center font-display text-sm font-bold text-forest">
        {value}
      </span>
      <button
        aria-label="Increase quantity"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="grid size-8 place-items-center rounded-lg bg-cream/60 text-forest transition hover:bg-cream disabled:opacity-40"
        disabled={value >= max}
      >
        +
      </button>
    </div>
  );
}

// ---------------- Rating stars (input) ----------------
export function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
          onClick={() => onChange(n)}
          className="text-2xl transition hover:scale-110"
        >
          <span
            className={cn(
              n <= value ? "text-gold" : "text-muted-foreground/40"
            )}
          >
            ★
          </span>
        </button>
      ))}
    </div>
  );
}

// ---------------- Mock image fallback wrapper ----------------
export function FoodImage({
  src,
  alt,
  className,
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const url = src && src.trim() ? src : "/cibo-logo.svg";
  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      className={cn("size-full object-cover", className)}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).src = "/cibo-logo.svg";
      }}
    />
  );
}
