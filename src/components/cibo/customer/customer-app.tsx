"use client";

import { useApp, useCart } from "@/lib/store";
import { useAuth } from "@/components/providers";
import { CiboLogo } from "../logo";
import { Button } from "@/components/ui/button";
import {
  Home as HomeIcon,
  Compass,
  Sparkles,
  ClipboardList,
  User as UserIcon,
  Bell,
  ShoppingCart,
  MapPin,
  ChevronDown,
  Heart,
  LifeBuoy,
  LogOut,
  LayoutDashboard,
  Shield,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { notifApi } from "@/lib/api-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AnimatePresence, motion } from "framer-motion";
import { CITIES, COORDS } from "./shared";
import { HomeView } from "./home-view";
import { ExploreView } from "./explore-view";
import { SearchView } from "./search-view";
import { RescueView } from "./rescue-view";
import { ListingView } from "./listing-view";
import { CartView } from "./cart-view";
import { CheckoutView } from "./checkout-view";
import { OrderTrackingView } from "./order-tracking-view";
import { OrdersView } from "./orders-view";
import { ProfileView } from "./profile-view";
import { FavoritesView } from "./favorites-view";
import { AddressesView } from "./addresses-view";
import { NotificationsView } from "./notifications-view";
import { HelpView } from "./help-view";
import type { CustomerView } from "@/lib/store";

const BOTTOM_NAV: { view: CustomerView; label: string; icon: typeof HomeIcon }[] =
  [
    { view: "home", label: "Home", icon: HomeIcon },
    { view: "explore", label: "Explore", icon: Compass },
    { view: "rescue", label: "Rescue", icon: Sparkles },
    { view: "orders", label: "Orders", icon: ClipboardList },
    { view: "profile", label: "Profile", icon: UserIcon },
  ];

const DESKTOP_NAV: { view: CustomerView; label: string }[] = [
  { view: "home", label: "Home" },
  { view: "explore", label: "Explore" },
  { view: "rescue", label: "Rescue" },
  { view: "orders", label: "Orders" },
  { view: "favorites", label: "Favorites" },
];

export function CustomerApp() {
  const customerView = useApp((s) => s.customerView);
  const setCustomer = useApp((s) => s.setCustomer);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopBar />
      <DesktopNav />
      <main className="flex-1 pb-28 pt-4 lg:pb-10 lg:pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={customerView}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            {customerView === "home" && <HomeView />}
            {customerView === "explore" && <ExploreView />}
            {customerView === "search" && <SearchView />}
            {customerView === "rescue" && <RescueView />}
            {customerView === "listing" && <ListingView />}
            {customerView === "cart" && <CartView />}
            {customerView === "checkout" && <CheckoutView />}
            {customerView === "orderTracking" && <OrderTrackingView />}
            {customerView === "orders" && <OrdersView />}
            {customerView === "profile" && <ProfileView />}
            {customerView === "favorites" && <FavoritesView />}
            {customerView === "addresses" && <AddressesView />}
            {customerView === "notifications" && <NotificationsView />}
            {customerView === "help" && <HelpView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating cart button (mobile) */}
      <FloatingCart />

      {/* Mobile bottom nav */}
      <nav
        aria-label="Bottom navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-forest/8 bg-card/95 backdrop-blur-xl lg:hidden"
      >
        <div className="mx-auto flex max-w-md items-stretch justify-between px-2">
          {BOTTOM_NAV.map((item) => {
            const active = customerView === item.view;
            const Icon = item.icon;
            return (
              <button
                key={item.view}
                onClick={() => setCustomer(item.view)}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition",
                  active ? "text-orange" : "text-muted-foreground"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  className={cn(
                    "size-5 transition",
                    active && "scale-110"
                  )}
                />
                {item.label}
              </button>
            );
          })}
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  );
}

// ---------------- Top Bar ----------------
function TopBar() {
  const city = useApp((s) => s.city);
  const setLocation = useApp((s) => s.setLocation);
  const setCustomer = useApp((s) => s.setCustomer);
  const { user } = useAuth();
  const cartCount = useCart((s) => s.items.reduce((a, b) => a + b.quantity, 0));

  return (
    <header className="sticky top-0 z-30 border-b border-forest/8 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => setCustomer("home")}
          className="flex items-center gap-2"
          aria-label="CIBO home"
        >
          <CiboLogo size={34} showWordmark={false} />
          <span className="hidden font-display text-xl font-bold tracking-wider text-forest sm:inline">
            CIBO
          </span>
        </button>

        <div className="ml-1 hidden items-center gap-2 lg:flex">
          <DesktopNavLinks />
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {/* City picker */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-forest/15 bg-card px-2.5 text-xs font-semibold text-forest transition hover:border-gold hover:bg-cream/60"
                aria-label="Pick city"
              >
                <MapPin className="size-3.5 text-orange" />
                <span className="max-w-[7rem] truncate">{city}</span>
                <ChevronDown className="size-3 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>Choose city</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {CITIES.map((c) => (
                <DropdownMenuItem
                  key={c}
                  onClick={() => {
                    const [lat, lng] = COORDS[c];
                    setLocation(c, lat, lng);
                  }}
                  className={cn(city === c && "bg-cream/60 font-semibold")}
                >
                  <MapPin className="size-3.5 text-gold" /> {c}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <NotificationCenter />

          {/* Cart (desktop) */}
          <button
            onClick={() => setCustomer("cart")}
            className="relative hidden h-10 w-10 items-center justify-center rounded-xl border border-forest/15 bg-card text-forest transition hover:border-gold hover:bg-cream/60 lg:inline-flex"
            aria-label="Open cart"
          >
            <ShoppingCart className="size-4" />
            {cartCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid size-4 place-items-center rounded-full bg-orange text-[9px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>

          {/* Profile / auth */}
          {user ? (
            <UserMenu />
          ) : (
            <Button
              size="sm"
              variant="rescue"
              className="hidden sm:inline-flex"
              onClick={() => useApp.getState().setAuthView("login")}
            >
              Log in
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

function DesktopNavLinks() {
  const customerView = useApp((s) => s.customerView);
  const setCustomer = useApp((s) => s.setCustomer);
  return (
    <>
      {DESKTOP_NAV.map((n) => (
        <button
          key={n.view}
          onClick={() => setCustomer(n.view)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition",
            customerView === n.view
              ? "bg-forest text-ivory"
              : "text-forest/80 hover:bg-cream/60"
          )}
        >
          {n.label}
        </button>
      ))}
    </>
  );
}

function DesktopNav() {
  // Empty placeholder; nav links are inside TopBar to save vertical space.
  return null;
}

// ---------------- User menu ----------------
function UserMenu() {
  const { user, logout } = useAuth();
  const setCustomer = useApp((s) => s.setCustomer);
  const go = useApp((s) => s.go);
  if (!user) return null;

  const onLogout = async () => {
    await logout();
    go("landing");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="grid size-10 place-items-center rounded-full bg-forest text-xs font-bold text-ivory transition hover:bg-forest-deep"
          aria-label="Open profile menu"
        >
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="size-10 rounded-full object-cover"
            />
          ) : (
            initials(user.name)
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="truncate font-display text-sm font-bold text-forest">
              {user.name}
            </span>
            <span className="truncate text-[11px] font-normal text-muted-foreground">
              {user.email}
            </span>
            <span className="mt-1 inline-flex w-fit rounded-full bg-cream px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-forest">
              {user.role}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setCustomer("profile")}>
          <UserIcon className="size-3.5 text-gold" /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setCustomer("orders")}>
          <ClipboardList className="size-3.5 text-gold" /> My orders
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setCustomer("favorites")}>
          <Heart className="size-3.5 text-gold" /> Favorites
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setCustomer("addresses")}>
          <MapPin className="size-3.5 text-gold" /> Addresses
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setCustomer("help")}>
          <LifeBuoy className="size-3.5 text-gold" /> Help & support
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {(user.role === "PROVIDER" || user.role === "ADMIN") && (
          <DropdownMenuItem onClick={() => go("provider")}>
            <LayoutDashboard className="size-3.5 text-olive" /> Provider dashboard
          </DropdownMenuItem>
        )}
        {(user.role === "ADMIN" || user.role === "SUPPORT") && (
          <DropdownMenuItem onClick={() => go("admin")}>
            <Shield className="size-3.5 text-olive" /> Admin panel
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={onLogout} className="text-danger">
          <LogOut className="size-3.5" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------------- Notification center ----------------
function NotificationCenter() {
  const { user } = useAuth();
  const setCustomer = useApp((s) => s.setCustomer);
  const { data } = useQuery({
    queryKey: ["notifications", "header"],
    queryFn: () => notifApi.list(),
    enabled: !!user,
    staleTime: 60_000,
  });
  const unread = data?.notifications?.filter((n) => !n.read).length || 0;

  return (
    <button
      onClick={() => setCustomer("notifications")}
      className="relative grid size-10 place-items-center rounded-xl border border-forest/15 bg-card text-forest transition hover:border-gold hover:bg-cream/60"
      aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
    >
      <Bell className="size-4" />
      {unread > 0 && (
        <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-orange text-[9px] font-bold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </button>
  );
}

// ---------------- Floating cart ----------------
function FloatingCart() {
  const cartCount = useCart((s) => s.items.reduce((a, b) => a + b.quantity, 0));
  const customerView = useApp((s) => s.customerView);
  const setCustomer = useApp((s) => s.setCustomer);
  if (cartCount === 0) return null;
  if (customerView === "cart" || customerView === "checkout") return null;
  return (
    <button
      onClick={() => setCustomer("cart")}
      className="fixed bottom-20 right-4 z-40 inline-flex h-14 items-center gap-2 rounded-full bg-orange px-5 text-sm font-bold text-white cibo-shadow-gold transition hover:brightness-105 active:scale-95 lg:bottom-6"
      aria-label={`View cart, ${cartCount} items`}
    >
      <ShoppingCart className="size-5" />
      <span>{cartCount} in cart</span>
      <span className="grid size-6 place-items-center rounded-full bg-white/25 text-xs">
        {cartCount}
      </span>
    </button>
  );
}
