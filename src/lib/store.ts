"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ---------------- App view / navigation (single-page router) ----------------

export type AppSurface = "landing" | "customer" | "provider" | "admin";
export type CustomerView =
  | "home"
  | "explore"
  | "rescue"
  | "orders"
  | "profile"
  | "listing"
  | "cart"
  | "checkout"
  | "orderTracking"
  | "favorites"
  | "addresses"
  | "notifications"
  | "help"
  | "search";
export type ProviderView =
  | "dashboard"
  | "create"
  | "listings"
  | "orders"
  | "inventory"
  | "earnings"
  | "analytics"
  | "profile"
  | "verification"
  | "support";
export type AdminView =
  | "overview"
  | "users"
  | "providers"
  | "listings"
  | "orders"
  | "payments"
  | "complaints"
  | "safety"
  | "verification"
  | "reports"
  | "analytics"
  | "settings";
export type AuthView = "login" | "signup" | "forgot" | "reset" | "providerSignup";

interface AppState {
  surface: AppSurface | "auth";
  authView: AuthView;
  customerView: CustomerView;
  providerView: ProviderView;
  adminView: AdminView;
  activeListingId: string | null;
  activeOrderId: string | null;
  // location
  city: string;
  lat: number;
  lng: number;
  // search
  searchQuery: string;
  // keep last customer view for bottom nav
  go: (surface: AppState["surface"]) => void;
  setAuthView: (v: AuthView) => void;
  setCustomer: (v: CustomerView) => void;
  setProvider: (v: ProviderView) => void;
  setAdmin: (v: AdminView) => void;
  openListing: (id: string) => void;
  openOrder: (id: string) => void;
  setLocation: (city: string, lat: number, lng: number) => void;
  setSearch: (q: string) => void;
}

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      surface: "landing",
      authView: "login",
      customerView: "home",
      providerView: "dashboard",
      adminView: "overview",
      activeListingId: null,
      activeOrderId: null,
      city: "Tirunelveli",
      lat: 8.7139,
      lng: 77.7567,
      searchQuery: "",
      go: (surface) => set({ surface }),
      setAuthView: (authView) => set({ surface: "auth", authView }),
      setCustomer: (customerView) => set({ surface: "customer", customerView }),
      setProvider: (providerView) => set({ surface: "provider", providerView }),
      setAdmin: (adminView) => set({ surface: "admin", adminView }),
      openListing: (activeListingId) =>
        set({ surface: "customer", customerView: "listing", activeListingId }),
      openOrder: (activeOrderId) =>
        set({ surface: "customer", customerView: "orderTracking", activeOrderId }),
      setLocation: (city, lat, lng) => set({ city, lat, lng }),
      setSearch: (searchQuery) => set({ searchQuery }),
    }),
    {
      name: "cibo-app",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        surface: s.surface,
        customerView: s.customerView,
        providerView: s.providerView,
        adminView: s.adminView,
        city: s.city,
        lat: s.lat,
        lng: s.lng,
      }),
    }
  )
);

// ---------------- Cart ----------------

export interface CartItem {
  listingId: string;
  title: string;
  image: string;
  price: number;
  quantity: number;
  providerId: string;
  providerName: string;
  pickupDeadline: string;
  pickupStart: string;
  fulfillment: string;
  maxQty: number;
}

interface CartState {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (listingId: string) => void;
  setQty: (listingId: string, qty: number) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) =>
        set((s) => {
          const existing = s.items.find((i) => i.listingId === item.listingId);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.listingId === item.listingId
                  ? { ...i, quantity: Math.min(i.maxQty, i.quantity + item.quantity) }
                  : i
              ),
            };
          }
          return { items: [...s.items, item] };
        }),
      remove: (listingId) =>
        set((s) => ({ items: s.items.filter((i) => i.listingId !== listingId) })),
      setQty: (listingId, qty) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.listingId === listingId
              ? { ...i, quantity: Math.max(1, Math.min(i.maxQty, qty)) }
              : i
          ),
        })),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((a, b) => a + b.quantity, 0),
      subtotal: () => get().items.reduce((a, b) => a + b.price * b.quantity, 0),
    }),
    {
      name: "cibo-cart",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// ---------------- UI preferences ----------------

interface UiState {
  locationPickerOpen: boolean;
  setLocationPicker: (v: boolean) => void;
  customerNavOpen: boolean;
  setCustomerNav: (v: boolean) => void;
}

export const useUi = create<UiState>((set) => ({
  locationPickerOpen: false,
  setLocationPicker: (locationPickerOpen) => set({ locationPickerOpen }),
  customerNavOpen: false,
  setCustomerNav: (customerNavOpen) => set({ customerNavOpen }),
}));
