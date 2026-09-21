"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { useAuth } from "@/components/providers";
import { CiboLogo, CiboMark } from "../logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { providerApi } from "@/lib/api-client";
import {
  LayoutDashboard,
  PlusCircle,
  Package,
  ClipboardList,
  Boxes,
  Wallet,
  BarChart3,
  UserCircle,
  ShieldCheck,
  LifeBuoy,
  Menu,
  LogOut,
  Store,
  ChevronRight,
  Bell,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import type { ProviderView } from "@/lib/store";
import type { ProviderProfileExt } from "./shared";
import { VerificationPill } from "./shared";
import { DashboardView } from "./dashboard-view";
import { CreateView } from "./create-view";
import { ListingsView } from "./listings-view";
import { OrdersView } from "./orders-view";
import { InventoryView } from "./inventory-view";
import { EarningsView } from "./earnings-view";
import { AnalyticsView } from "./analytics-view";
import { ProfileView } from "./profile-view";
import { VerificationView } from "./verification-view";
import { SupportView } from "./support-view";

const NAV: { view: ProviderView; label: string; icon: typeof LayoutDashboard; group?: string }[] = [
  { view: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { view: "create", label: "Create Listing", icon: PlusCircle },
  { view: "listings", label: "Active Listings", icon: Package },
  { view: "orders", label: "Orders", icon: ClipboardList },
  { view: "inventory", label: "Inventory", icon: Boxes },
  { view: "earnings", label: "Earnings", icon: Wallet },
  { view: "analytics", label: "Analytics", icon: BarChart3 },
  { view: "profile", label: "Profile", icon: UserCircle },
  { view: "verification", label: "Verification", icon: ShieldCheck },
  { view: "support", label: "Support", icon: LifeBuoy },
];

const TITLES: Record<ProviderView, string> = {
  dashboard: "Dashboard",
  create: "Create Listing",
  listings: "Active Listings",
  orders: "Orders",
  inventory: "Inventory",
  earnings: "Earnings",
  analytics: "Analytics",
  profile: "Profile",
  verification: "Verification",
  support: "Support",
};

export function ProviderApp() {
  const providerView = useApp((s) => s.providerView);
  const setProvider = useApp((s) => s.setProvider);
  const { user, loading, logout } = useAuth();

  const meQ = useQuery({
    queryKey: ["provider", "me"],
    queryFn: () => providerApi.me(),
    enabled: !!user,
  });
  const provider = meQ.data?.provider as ProviderProfileExt | undefined;

  // Auth guard
  if (!loading && !user) {
    return <LoginGate />;
  }
  if (user && user.role !== "PROVIDER" && user.role !== "ADMIN") {
    return <NotProviderGate />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-forest/8 bg-card lg:flex">
        <SidebarContent
          providerView={providerView}
          setProvider={setProvider}
          user={user}
          provider={provider}
          providerLoading={meQ.isLoading}
          onLogout={async () => {
            await logout();
            useApp.getState().go("landing");
          }}
        />
      </aside>

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar provider={provider} providerLoading={meQ.isLoading} />
        {provider && provider.verificationStatus !== "VERIFIED" && (
          <VerificationBanner status={provider.verificationStatus} />
        )}
        <main className="flex-1 pt-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={providerView}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              {providerView === "dashboard" && <DashboardView />}
              {providerView === "create" && <CreateView />}
              {providerView === "listings" && <ListingsView />}
              {providerView === "orders" && <OrdersView />}
              {providerView === "inventory" && <InventoryView />}
              {providerView === "earnings" && <EarningsView />}
              {providerView === "analytics" && <AnalyticsView />}
              {providerView === "profile" && <ProfileView />}
              {providerView === "verification" && <VerificationView />}
              {providerView === "support" && <SupportView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

// ---------------- Sidebar content (shared between desktop & sheet) ----------------
function SidebarContent({
  providerView,
  setProvider,
  user,
  provider,
  providerLoading,
  onLogout,
}: {
  providerView: ProviderView;
  setProvider: (v: ProviderView) => void;
  user: any;
  provider?: ProviderProfileExt;
  providerLoading: boolean;
  onLogout: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-forest/8 px-5">
        <CiboLogo size={32} showWordmark={false} />
        <div className="leading-none">
          <p className="font-display text-lg font-bold tracking-[0.18em] text-forest">
            CIBO
          </p>
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-gold">
            Provider
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav aria-label="Provider navigation" className="scrollbar-cibo flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = providerView === n.view;
            return (
              <li key={n.view}>
                <button
                  onClick={() => setProvider(n.view)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold transition",
                    active
                      ? "border-l-[3px] border-orange bg-cream text-forest"
                      : "border-l-[3px] border-transparent text-forest/70 hover:bg-cream/40 hover:text-forest"
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0",
                      active ? "text-orange" : "text-muted-foreground"
                    )}
                  />
                  {n.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="border-t border-forest/8 p-3">
        {providerLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full rounded-xl cibo-skeleton" />
          </div>
        ) : (
          <div className="rounded-2xl bg-cream/40 p-3">
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 place-items-center rounded-full bg-forest text-[10px] font-bold text-ivory">
                {user?.name ? initials(user.name) : "PR"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-forest">
                  {provider?.businessName || user?.name || "Provider"}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </div>
            {provider && (
              <div className="mt-2 flex items-center justify-between">
                <VerificationPill status={provider.verificationStatus} />
                <button
                  onClick={onLogout}
                  className="grid size-7 place-items-center rounded-lg text-muted-foreground transition hover:bg-card hover:text-danger"
                  aria-label="Log out"
                >
                  <LogOut className="size-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------- Top bar ----------------
function TopBar({
  provider,
  providerLoading,
}: {
  provider?: ProviderProfileExt;
  providerLoading: boolean;
}) {
  const providerView = useApp((s) => s.providerView);
  const [open, setOpen] = useState(false);
  const setProvider = useApp((s) => s.setProvider);
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-forest/8 bg-background/85 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Mobile menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              className="grid size-10 place-items-center rounded-xl border border-forest/15 bg-card text-forest transition hover:border-gold hover:bg-cream/60 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-4" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Provider navigation</SheetTitle>
            </SheetHeader>
            <SidebarContent
              providerView={providerView}
              setProvider={(v) => {
                setProvider(v);
                setOpen(false);
              }}
              user={user}
              provider={provider}
              providerLoading={providerLoading}
              onLogout={async () => {
                setOpen(false);
                await logout();
                useApp.getState().go("landing");
              }}
            />
          </SheetContent>
        </Sheet>

        {/* Mobile logo */}
        <div className="flex items-center gap-2 lg:hidden">
          <CiboMark size={28} />
          <span className="font-display text-base font-bold tracking-[0.18em] text-forest">
            CIBO
          </span>
        </div>

        {/* Page title (desktop) */}
        <div className="hidden lg:block">
          <h1 className="font-display text-xl font-bold text-forest">
            {TITLES[providerView]}
          </h1>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Notifications (mock bell) */}
          <button
            onClick={() => setProvider("orders")}
            className="relative grid size-10 place-items-center rounded-xl border border-forest/15 bg-card text-forest transition hover:border-gold hover:bg-cream/60"
            aria-label="View orders"
          >
            <Bell className="size-4" />
          </button>

          {/* Provider name + verification (desktop) */}
          {providerLoading ? (
            <Skeleton className="hidden h-10 w-44 rounded-xl cibo-skeleton lg:block" />
          ) : (
            provider && (
              <button
                onClick={() => setProvider("profile")}
                className="hidden items-center gap-2.5 rounded-xl border border-forest/15 bg-card px-3 py-2 text-left transition hover:border-gold hover:bg-cream/60 lg:flex"
              >
                <div className="grid size-7 place-items-center rounded-full bg-forest text-[10px] font-bold text-ivory">
                  {initials(provider.businessName || provider.ownerName)}
                </div>
                <div className="leading-tight">
                  <p className="max-w-[10rem] truncate text-xs font-bold text-forest">
                    {provider.businessName}
                  </p>
                  <div className="mt-0.5">
                    <VerificationPill status={provider.verificationStatus} />
                  </div>
                </div>
                <ChevronRight className="size-3.5 text-muted-foreground" />
              </button>
            )
          )}
        </div>
      </div>
    </header>
  );
}

// ---------------- Verification banner ----------------
function VerificationBanner({
  status,
}: {
  status: ProviderProfileExt["verificationStatus"];
}) {
  const setProvider = useApp((s) => s.setProvider);
  const map: Record<string, { msg: string; tone: string }> = {
    PENDING: {
      msg: "Your account is pending verification. You can create draft listings but cannot publish until verified.",
      tone: "bg-gold/10 border-gold/30 text-gold",
    },
    UNDER_REVIEW: {
      msg: "Your documents are under review. You'll be notified once verification is complete.",
      tone: "bg-gold/10 border-gold/30 text-gold",
    },
    REJECTED: {
      msg: "Your verification was rejected. Please review and resubmit your documents.",
      tone: "bg-danger/10 border-danger/30 text-danger",
    },
    SUSPENDED: {
      msg: "Your account is suspended. Contact support for assistance.",
      tone: "bg-danger/10 border-danger/30 text-danger",
    },
  };
  const m = map[status] || map.PENDING;
  return (
    <div className={cn("border-b px-4 py-2.5 text-xs font-semibold sm:px-6 lg:px-8", m.tone)}>
      <div className="mx-auto flex max-w-6xl items-center gap-2">
        <ShieldCheck className="size-3.5 shrink-0" />
        <span className="flex-1">{m.msg}</span>
        {(status === "REJECTED" || status === "PENDING") && (
          <button
            onClick={() => setProvider("verification")}
            className="shrink-0 underline underline-offset-2"
          >
            Review →
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------- Auth gates ----------------
function LoginGate() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="mx-auto max-w-md rounded-3xl border border-forest/8 bg-card p-8 text-center cibo-shadow">
        <CiboMark size={64} className="mx-auto animate-float" />
        <div className="mt-4 grid size-12 mx-auto place-items-center rounded-2xl bg-cream text-forest">
          <Store className="size-6" />
        </div>
        <h2 className="mt-4 font-display text-xl font-bold text-forest">
          Log in to access provider dashboard
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          You need to log in with a provider account to manage your listings,
          orders, and earnings.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Button
            variant="rescue"
            size="lg"
            onClick={() => useApp.getState().setAuthView("login")}
          >
            Log in
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => useApp.getState().setAuthView("providerSignup")}
          >
            Become a partner
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => useApp.getState().go("landing")}
          >
            Back to home
          </Button>
        </div>
      </div>
    </div>
  );
}

function NotProviderGate() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="mx-auto max-w-md rounded-3xl border border-forest/8 bg-card p-8 text-center cibo-shadow">
        <CiboMark size={64} className="mx-auto animate-float" />
        <div className="mt-4 grid size-12 mx-auto place-items-center rounded-2xl bg-cream text-forest">
          <ShieldCheck className="size-6" />
        </div>
        <h2 className="mt-4 font-display text-xl font-bold text-forest">
          You need a provider account
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your current account doesn't have provider access. Sign up as a CIBO
          partner to start rescuing surplus food.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Button
            variant="rescue"
            size="lg"
            onClick={() => useApp.getState().setAuthView("providerSignup")}
          >
            Become a partner
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => useApp.getState().go("customer")}
          >
            Continue as customer
          </Button>
        </div>
      </div>
    </div>
  );
}
