"use client";

import { useApp } from "@/lib/store";
import { useAuth } from "@/components/providers";
import { useQuery } from "@tanstack/react-query";
import { orderApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PageShell } from "./shared";
import { CiboMark } from "../logo";
import { toast } from "sonner";
import {
  User as UserIcon,
  MapPin,
  Heart,
  ClipboardList,
  Bell,
  CreditCard,
  LifeBuoy,
  LogOut,
  ChevronRight,
  ShieldCheck,
  LayoutDashboard,
  FileText,
  Lock,
  Phone,
  Leaf,
  ShoppingBag,
  IndianRupee,
  TrendingDown,
} from "lucide-react";
import { useState } from "react";
import { cn, initials, fmtPrice } from "@/lib/utils";

export function ProfileView() {
  const { user, logout } = useAuth();
  const setCustomer = useApp((s) => s.setCustomer);
  const go = useApp((s) => s.go);
  const setAuthView = useApp((s) => s.setAuthView);

  const [diet, setDiet] = useState("ANY");
  const [halalPref, setHalalPref] = useState(false);
  const [vegOnly, setVegOnly] = useState(false);

  // Rescue impact stats
  const { data: statsData } = useQuery({
    queryKey: ["order-stats"],
    queryFn: () => orderApi.stats(),
    enabled: !!user,
  });
  const stats = statsData?.stats;

  if (!user) {
    return (
      <PageShell className="py-6">
        <div className="mx-auto max-w-md space-y-4">
          <div className="rounded-3xl border border-forest/8 bg-card p-8 text-center cibo-shadow">
            <CiboMark size={56} className="mx-auto opacity-80" />
            <h2 className="mt-4 font-display text-xl font-bold text-forest">
              Welcome to CIBO
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Log in or create an account to rescue food, track orders, and save
              your favorite providers.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Button variant="rescue" size="lg" onClick={() => setAuthView("login")}>
                Log in
              </Button>
              <Button variant="outline" size="lg" onClick={() => setAuthView("signup")}>
                Create an account
              </Button>
            </div>
          </div>
          <button
            onClick={() => setAuthView("providerSignup")}
            className="w-full rounded-2xl border border-forest/8 bg-cream/40 p-4 text-left text-sm transition hover:bg-cream"
          >
            <p className="font-display font-bold text-forest">
              Are you a food business? →
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Become a CIBO provider and start rescuing surplus today.
            </p>
          </button>
        </div>
      </PageShell>
    );
  }

  const onLogout = async () => {
    await logout();
    go("landing");
  };

  const items = [
    { label: "Personal details", icon: UserIcon, view: undefined, hint: user.email },
    { label: "Saved addresses", icon: MapPin, view: "addresses" as const },
    { label: "Order history", icon: ClipboardList, view: "orders" as const },
    { label: "Favorites", icon: Heart, view: "favorites" as const },
    { label: "Notifications", icon: Bell, view: "notifications" as const },
    { label: "Help & support", icon: LifeBuoy, view: "help" as const },
  ];

  return (
    <PageShell className="space-y-5">
      {/* Profile card */}
      <section className="relative overflow-hidden rounded-3xl bg-forest p-6 text-ivory">
        <div className="absolute inset-0 cibo-grain opacity-30" />
        <div className="absolute -right-12 -top-12 size-48 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="grid size-16 place-items-center rounded-2xl bg-gold text-2xl font-bold text-forest-deep">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="size-16 rounded-2xl object-cover"
              />
            ) : (
              initials(user.name)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-xl font-bold">
              {user.name}
            </h1>
            <p className="truncate text-sm text-ivory/80">{user.email}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-2 py-0.5 font-bold uppercase tracking-wide text-gold">
                <ShieldCheck className="size-3" /> {user.role}
              </span>
              {user.phone && (
                <span className="inline-flex items-center gap-1 text-ivory/80">
                  <Phone className="size-3" /> {user.phone}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Rescue impact stats */}
      {stats && stats.totalOrders > 0 && (
        <section className="overflow-hidden rounded-3xl border border-forest/8 bg-gradient-to-br from-cream to-ivory p-5 cibo-shadow">
          <div className="flex items-center gap-2">
            <Leaf className="size-4 text-success" />
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-forest">
              Your rescue impact
            </h3>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ImpactStat
              icon={ShoppingBag}
              value={String(stats.mealsRescued)}
              label="Meals rescued"
              color="bg-orange/15 text-orange"
            />
            <ImpactStat
              icon={TrendingDown}
              value={fmtPrice(stats.totalSaved)}
              label="Money saved"
              color="bg-success/15 text-success"
            />
            <ImpactStat
              icon={Leaf}
              value={`${stats.co2AvoidedKg} kg`}
              label="CO₂ avoided"
              color="bg-olive/15 text-olive"
            />
            <ImpactStat
              icon={ClipboardList}
              value={String(stats.completedOrders)}
              label="Completed orders"
              color="bg-gold/15 text-gold"
            />
          </div>
          {stats.topProviders && stats.topProviders.length > 0 && (
            <div className="mt-4 border-t border-forest/8 pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Your favourite providers
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {stats.topProviders.map((p: any) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-forest/10 bg-card px-2.5 py-1 text-xs font-semibold text-forest"
                  >
                    <span className="size-1.5 rounded-full bg-gold" />
                    {p.businessName}
                    <span className="text-muted-foreground">· {p.orderCount}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Role shortcuts */}
      {(user.role === "PROVIDER" ||
        user.role === "ADMIN" ||
        user.role === "SUPPORT") && (
        <section className="grid gap-3 sm:grid-cols-2">
          {user.role === "PROVIDER" && (
            <button
              onClick={() => go("provider")}
              className="flex items-center gap-3 rounded-2xl border border-forest/8 bg-card p-4 text-left transition hover:border-gold cibo-shadow"
            >
              <div className="grid size-10 place-items-center rounded-xl bg-olive/15 text-olive">
                <LayoutDashboard className="size-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-forest">
                  Go to Provider Dashboard
                </p>
                <p className="text-xs text-muted-foreground">
                  Manage listings, orders, analytics
                </p>
              </div>
              <ChevronRight className="ml-auto size-4 text-muted-foreground" />
            </button>
          )}
          {(user.role === "ADMIN" || user.role === "SUPPORT") && (
            <button
              onClick={() => go("admin")}
              className="flex items-center gap-3 rounded-2xl border border-forest/8 bg-card p-4 text-left transition hover:border-gold cibo-shadow"
            >
              <div className="grid size-10 place-items-center rounded-xl bg-forest/15 text-forest">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-forest">
                  Go to Admin Panel
                </p>
                <p className="text-xs text-muted-foreground">
                  Manage users, providers, complaints
                </p>
              </div>
              <ChevronRight className="ml-auto size-4 text-muted-foreground" />
            </button>
          )}
        </section>
      )}

      {/* Preferences */}
      <section className="rounded-2xl border border-forest/8 bg-card p-5 cibo-shadow">
        <h3 className="mb-3 font-display text-base font-bold text-forest">
          Food preferences
        </h3>
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Dietary preference
            </Label>
            <RadioGroup
              value={diet}
              onValueChange={setDiet}
              className="mt-2 grid grid-cols-3 gap-2"
            >
              {[
                { value: "ANY", label: "Anything" },
                { value: "VEG", label: "Vegetarian" },
                { value: "NON_VEG", label: "Non-Veg" },
              ].map((d) => (
                <label
                  key={d.value}
                  className={cn(
                    "flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-2 py-2 text-xs font-semibold transition",
                    diet === d.value
                      ? "border-forest bg-forest text-ivory"
                      : "border-forest/15 bg-card text-forest hover:bg-cream/50"
                  )}
                >
                  <RadioGroupItem value={d.value} className="sr-only" />
                  {d.label}
                </label>
              ))}
            </RadioGroup>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-forest">
                Show halal-verified only
              </p>
              <p className="text-[11px] text-muted-foreground">
                Filter listings to halal-verified providers
              </p>
            </div>
            <Switch
              checked={halalPref}
              onCheckedChange={(v) => {
                setHalalPref(v);
                toast.success(`Halal filter ${v ? "enabled" : "disabled"}`);
              }}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-forest">
                Vegetarian only
              </p>
              <p className="text-[11px] text-muted-foreground">
                Hide non-veg listings across the app
              </p>
            </div>
            <Switch
              checked={vegOnly}
              onCheckedChange={(v) => {
                setVegOnly(v);
                toast.success(`Veg filter ${v ? "enabled" : "disabled"}`);
              }}
            />
          </div>
        </div>
      </section>

      {/* Menu list */}
      <section className="overflow-hidden rounded-2xl border border-forest/8 bg-card cibo-shadow">
        {items.map((it, i) => {
          const Icon = it.icon;
          return (
            <button
              key={it.label}
              onClick={() => it.view && setCustomer(it.view)}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-cream/40",
                i > 0 && "border-t border-forest/8"
              )}
            >
              <div className="grid size-8 place-items-center rounded-lg bg-cream text-forest">
                <Icon className="size-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-forest">{it.label}</p>
                {it.hint && (
                  <p className="text-[11px] text-muted-foreground">{it.hint}</p>
                )}
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
          );
        })}
      </section>

      {/* Mock rows */}
      <section className="overflow-hidden rounded-2xl border border-forest/8 bg-card cibo-shadow">
        <Row icon={CreditCard} label="Payment methods" hint="Demo" />
        <Row icon={FileText} label="Terms of service" />
        <Row icon={Lock} label="Privacy policy" />
      </section>

      <Button
        variant="outline"
        size="lg"
        className="w-full text-danger"
        onClick={onLogout}
      >
        <LogOut className="size-4" /> Log out
      </Button>

      <p className="pb-2 text-center text-[11px] text-muted-foreground">
        CIBO · Good Food. Brighter Tomorrow.
      </p>
    </PageShell>
  );
}

function Row({
  icon: Icon,
  label,
  hint,
}: {
  icon: typeof UserIcon;
  label: string;
  hint?: string;
}) {
  return (
    <button className="flex w-full items-center gap-3 border-b border-forest/8 px-4 py-3.5 text-left transition last:border-b-0 hover:bg-cream/40">
      <div className="grid size-8 place-items-center rounded-lg bg-cream text-forest">
        <Icon className="size-4" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-forest">{label}</p>
      </div>
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      <ChevronRight className="size-4 text-muted-foreground" />
    </button>
  );
}

function ImpactStat({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: typeof UserIcon;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-forest/8 bg-card p-3">
      <div className={cn("grid size-8 place-items-center rounded-lg", color)}>
        <Icon className="size-4" />
      </div>
      <div className="mt-2 font-display text-lg font-extrabold text-forest">
        {value}
      </div>
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
