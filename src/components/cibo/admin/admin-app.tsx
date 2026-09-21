"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { useAuth } from "@/components/providers";
import { CiboMark } from "../logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  ClipboardList,
  Wallet,
  MessageSquareWarning,
  ShieldCheck,
  BadgeCheck,
  FileText,
  BarChart3,
  Settings,
  Menu,
  LogOut,
  ChevronRight,
  Shield,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import type { AdminView } from "@/lib/store";
import { OverviewView } from "./overview-view";
import { UsersView } from "./users-view";
import { ProvidersView } from "./providers-view";
import { VerificationView } from "./verification-view";
import { ListingsView } from "./listings-view";
import { OrdersView } from "./orders-view";
import { PaymentsView } from "./payments-view";
import { ComplaintsView } from "./complaints-view";
import { SafetyView } from "./safety-view";
import { ReportsView } from "./reports-view";
import { AnalyticsView } from "./analytics-view";
import { SettingsView } from "./settings-view";

const NAV: { view: AdminView; label: string; icon: typeof LayoutDashboard; group: string }[] = [
  { view: "overview", label: "Overview", icon: LayoutDashboard, group: "Operations" },
  { view: "users", label: "Users", icon: Users, group: "Operations" },
  { view: "providers", label: "Providers", icon: Store, group: "Operations" },
  { view: "listings", label: "Listings", icon: Package, group: "Operations" },
  { view: "orders", label: "Orders", icon: ClipboardList, group: "Operations" },
  { view: "payments", label: "Payments", icon: Wallet, group: "Operations" },
  { view: "complaints", label: "Complaints", icon: MessageSquareWarning, group: "Operations" },
  { view: "safety", label: "Food Safety", icon: ShieldCheck, group: "Operations" },
  { view: "verification", label: "Verification", icon: BadgeCheck, group: "Operations" },
  { view: "reports", label: "Reports", icon: FileText, group: "Insights" },
  { view: "analytics", label: "Analytics", icon: BarChart3, group: "Insights" },
  { view: "settings", label: "Settings", icon: Settings, group: "System" },
];

const TITLES: Record<AdminView, string> = {
  overview: "Overview",
  users: "Users",
  providers: "Providers",
  listings: "Listings",
  orders: "Orders",
  payments: "Payments",
  complaints: "Complaints",
  safety: "Food Safety",
  verification: "Verification Queue",
  reports: "Reports",
  analytics: "Analytics",
  settings: "Settings",
};

export function AdminApp() {
  const adminView = useApp((s) => s.adminView);
  const { user, loading } = useAuth();

  // Auth guard
  if (!loading && !user) {
    return <LoginGate />;
  }
  if (user && user.role !== "ADMIN" && user.role !== "SUPPORT") {
    return <AccessDeniedGate />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar (dark forest) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-forest text-ivory lg:flex">
        <SidebarContent />
      </aside>

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 pt-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={adminView}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              {adminView === "overview" && <OverviewView />}
              {adminView === "users" && <UsersView />}
              {adminView === "providers" && <ProvidersView />}
              {adminView === "listings" && <ListingsView />}
              {adminView === "orders" && <OrdersView />}
              {adminView === "payments" && <PaymentsView />}
              {adminView === "complaints" && <ComplaintsView />}
              {adminView === "safety" && <SafetyView />}
              {adminView === "verification" && <VerificationView />}
              {adminView === "reports" && <ReportsView />}
              {adminView === "analytics" && <AnalyticsView />}
              {adminView === "settings" && <SettingsView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

// ---------------- Sidebar (shared desktop & sheet) ----------------
function SidebarContent() {
  const adminView = useApp((s) => s.adminView);
  const setAdmin = useApp((s) => s.setAdmin);
  const { user, logout } = useAuth();

  // Group nav by `group`
  const groups: { name: string; items: typeof NAV }[] = [];
  for (const item of NAV) {
    const g = groups.find((x) => x.name === item.group);
    if (g) g.items.push(item);
    else groups.push({ name: item.group, items: [item] });
  }

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-ivory/10 px-5">
        <CiboMark size={32} />
        <div className="leading-none">
          <p className="font-display text-lg font-bold tracking-[0.18em] text-ivory">
            CIBO
          </p>
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-gold">
            Admin Panel
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav
        aria-label="Admin navigation"
        className="scrollbar-cibo flex-1 overflow-y-auto px-3 py-4"
      >
        {groups.map((g) => (
          <div key={g.name} className="mb-4">
            <p className="px-3 pb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-ivory/40">
              {g.name}
            </p>
            <ul className="space-y-1">
              {g.items.map((n) => {
                const Icon = n.icon;
                const active = adminView === n.view;
                return (
                  <li key={n.view}>
                    <button
                      onClick={() => setAdmin(n.view)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold transition",
                        active
                          ? "border-l-[3px] border-orange bg-ivory/10 text-gold"
                          : "border-l-[3px] border-transparent text-ivory/70 hover:bg-ivory/5 hover:text-ivory"
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-4 shrink-0",
                          active ? "text-gold" : "text-ivory/50"
                        )}
                      />
                      {n.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-ivory/10 p-3">
        <div className="rounded-2xl bg-ivory/5 p-3">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-full bg-gold text-[10px] font-bold text-forest-deep">
              {user?.name ? initials(user.name) : "AD"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-ivory">
                {user?.name || "Admin"}
              </p>
              <p className="truncate text-[10px] text-ivory/60">{user?.email}</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-orange/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-gold">
              <Shield className="size-2.5" /> {user?.role}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <button
              onClick={() => useApp.getState().go("landing")}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-ivory/70 transition hover:bg-ivory/10 hover:text-ivory"
            >
              <ChevronRight className="size-3" /> Back to site
            </button>
            <button
              onClick={async () => {
                await logout();
                useApp.getState().go("landing");
              }}
              className="grid size-7 place-items-center rounded-lg text-ivory/70 transition hover:bg-ivory/10 hover:text-gold"
              aria-label="Log out"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------- Top bar ----------------
function TopBar() {
  const adminView = useApp((s) => s.adminView);
  const [open, setOpen] = useState(false);

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
          <SheetContent side="left" className="w-72 border-0 bg-forest p-0 text-ivory">
            <SheetHeader className="sr-only">
              <SheetTitle>Admin navigation</SheetTitle>
            </SheetHeader>
            <MobileSidebarWrap onClose={() => setOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Mobile logo */}
        <div className="flex items-center gap-2 lg:hidden">
          <CiboMark size={28} />
          <span className="font-display text-base font-bold tracking-[0.18em] text-forest">
            CIBO
          </span>
          <span className="rounded-full bg-forest px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-gold">
            Admin
          </span>
        </div>

        {/* Page title (desktop) */}
        <div className="hidden lg:block">
          <h1 className="font-display text-xl font-bold text-forest">
            {TITLES[adminView]}
          </h1>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-forest/15 bg-card px-3 py-1.5 text-xs font-semibold text-forest sm:inline-flex">
            <span className="size-2 animate-pulse rounded-full bg-success" />
            Live operations
          </span>
        </div>
      </div>
    </header>
  );
}

// Mobile sidebar wrapper — closes Sheet on selection.
function MobileSidebarWrap({ onClose }: { onClose: () => void }) {
  const setAdmin = useApp((s) => s.setAdmin);
  const adminView = useApp((s) => s.adminView);
  const { user, logout } = useAuth();

  const groups: { name: string; items: typeof NAV }[] = [];
  for (const item of NAV) {
    const g = groups.find((x) => x.name === item.group);
    if (g) g.items.push(item);
    else groups.push({ name: item.group, items: [item] });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b border-ivory/10 px-5">
        <CiboMark size={32} />
        <div className="leading-none">
          <p className="font-display text-lg font-bold tracking-[0.18em] text-ivory">CIBO</p>
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-gold">Admin Panel</p>
        </div>
      </div>
      <nav aria-label="Admin navigation mobile" className="scrollbar-cibo flex-1 overflow-y-auto px-3 py-4">
        {groups.map((g) => (
          <div key={g.name} className="mb-4">
            <p className="px-3 pb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-ivory/40">
              {g.name}
            </p>
            <ul className="space-y-1">
              {g.items.map((n) => {
                const Icon = n.icon;
                const active = adminView === n.view;
                return (
                  <li key={n.view}>
                    <button
                      onClick={() => {
                        setAdmin(n.view);
                        onClose();
                      }}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold transition",
                        active
                          ? "border-l-[3px] border-orange bg-ivory/10 text-gold"
                          : "border-l-[3px] border-transparent text-ivory/70 hover:bg-ivory/5 hover:text-ivory"
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-4 shrink-0",
                          active ? "text-gold" : "text-ivory/50"
                        )}
                      />
                      {n.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-ivory/10 p-3">
        <div className="rounded-2xl bg-ivory/5 p-3">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-full bg-gold text-[10px] font-bold text-forest-deep">
              {user?.name ? initials(user.name) : "AD"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-ivory">{user?.name || "Admin"}</p>
              <p className="truncate text-[10px] text-ivory/60">{user?.email}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <button
              onClick={() => {
                onClose();
                useApp.getState().go("landing");
              }}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-ivory/70 transition hover:bg-ivory/10 hover:text-ivory"
            >
              <ChevronRight className="size-3" /> Back to site
            </button>
            <button
              onClick={async () => {
                onClose();
                await logout();
                useApp.getState().go("landing");
              }}
              className="grid size-7 place-items-center rounded-lg text-ivory/70 transition hover:bg-ivory/10 hover:text-gold"
              aria-label="Log out"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        </div>
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
        <div className="mt-4 grid size-12 mx-auto place-items-center rounded-2xl bg-forest text-ivory">
          <Shield className="size-6" />
        </div>
        <h2 className="mt-4 font-display text-xl font-bold text-forest">
          Log in to access admin panel
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          You need an admin or support account to manage the CIBO marketplace.
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

function AccessDeniedGate() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="mx-auto max-w-md rounded-3xl border border-forest/8 bg-card p-8 text-center cibo-shadow">
        <CiboMark size={64} className="mx-auto animate-float" />
        <div className="mt-4 grid size-12 mx-auto place-items-center rounded-2xl bg-danger/10 text-danger">
          <Shield className="size-6" />
        </div>
        <h2 className="mt-4 font-display text-xl font-bold text-forest">
          Access denied — admin only
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your current account doesn&apos;t have admin or support privileges. If
          you believe this is a mistake, contact your platform administrator.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Button
            variant="default"
            size="lg"
            onClick={() => useApp.getState().go("landing")}
          >
            Back to home
          </Button>
        </div>
      </div>
    </div>
  );
}
