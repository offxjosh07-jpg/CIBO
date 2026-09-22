"use client";

import { cn } from "@/lib/utils";
import { Leaf, Flame, Egg, Wheat, Sparkles, ShieldCheck, Clock, MapPin } from "lucide-react";
import type { FoodType, HalalStatus, ListingStatus } from "@/lib/types";

export function VegBadge({ type, className }: { type: FoodType; className?: string }) {
  const map: Record<FoodType, { color: string; label: string; icon: React.ReactNode }> = {
    VEG: { color: "border-success text-success", label: "VEG", icon: <Leaf className="size-2.5" /> },
    NON_VEG: { color: "border-danger text-danger", label: "NON-VEG", icon: <Flame className="size-2.5" /> },
    EGG: { color: "border-gold text-gold", label: "EGG", icon: <Egg className="size-2.5" /> },
    VEGAN: { color: "border-success text-success", label: "VEGAN", icon: <Leaf className="size-2.5" /> },
    JAIN: { color: "border-olive text-olive", label: "JAIN", icon: <Leaf className="size-2.5" /> },
  };
  const m = map[type] || map.VEG;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border-2 bg-card px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
        m.color,
        className
      )}
      title={m.label}
    >
      <span className="grid size-3 place-items-center">{m.icon}</span>
      {m.label}
    </span>
  );
}

export function HalalBadge({ status, className }: { status: HalalStatus; className?: string }) {
  if (status === "VERIFIED") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-forest px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-ivory",
          className
        )}
        title="Halal Verified"
      >
        <ShieldCheck className="size-2.5" /> Halal Verified
      </span>
    );
  }
  if (status === "DECLARED") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border border-forest/20 bg-cream px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-forest",
          className
        )}
        title="Provider declared halal"
      >
        Halal Declared
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-forest/10 bg-muted px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground",
        className
      )}
      title="Halal status not specified"
    >
      Halal N/A
    </span>
  );
}

export function RescueBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-orange px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white cibo-shadow-gold",
        className
      )}
    >
      <Sparkles className="size-3" /> Food Rescue
    </span>
  );
}

export function StatusBadge({ status, className }: { status: ListingStatus; className?: string }) {
  const map: Record<ListingStatus, { label: string; cls: string }> = {
    DRAFT: { label: "Draft", cls: "bg-muted text-muted-foreground" },
    ACTIVE: { label: "Active", cls: "bg-success/10 text-success border border-success/20" },
    SOLD_OUT: { label: "Sold Out", cls: "bg-danger/10 text-danger border border-danger/20" },
    EXPIRED: { label: "Expired", cls: "bg-muted text-muted-foreground border border-muted-foreground/20" },
    TAKEN_DOWN: { label: "Taken Down", cls: "bg-muted text-muted-foreground" },
  };
  const m = map[status] || map.ACTIVE;
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

export function DiscountTag({ pct, className }: { pct: number; className?: string }) {
  if (pct <= 0) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-forest px-2 py-0.5 text-[11px] font-extrabold text-gold",
        className
      )}
    >
      {pct}% OFF
    </span>
  );
}

export function PickupBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-cream px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-forest",
        className
      )}
    >
      <MapPin className="size-2.5" /> Pickup
    </span>
  );
}

export function DeadlineChip({ deadline, className }: { deadline: string | Date; className?: string }) {
  const d = typeof deadline === "string" ? new Date(deadline) : deadline;
  const mins = Math.max(0, Math.round((d.getTime() - Date.now()) / 60000));
  const urgent = mins <= 30;
  const soon = mins > 30 && mins <= 90;
  // Format duration readably
  const fmtDur = (m: number) => {
    if (m <= 0) return "Closed";
    if (m < 60) return `${m}m left`;
    const h = Math.floor(m / 60);
    const rem = m % 60;
    if (h < 24) return rem ? `${h}h ${rem}m left` : `${h}h left`;
    const days = Math.floor(h / 24);
    const remH = h % 24;
    return remH ? `${days}d ${remH}h left` : `${days}d left`;
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
        urgent ? "bg-danger/10 text-danger" : soon ? "bg-orange/15 text-orange" : "bg-gold/15 text-gold",
        className
      )}
    >
      <Clock className="size-2.5" />
      {mins <= 0 ? "Closed" : urgent ? `Closes in ${mins}m` : fmtDur(mins)}
    </span>
  );
}
