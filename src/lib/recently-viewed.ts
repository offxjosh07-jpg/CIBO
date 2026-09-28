"use client";

import { useSyncExternalStore, useCallback } from "react";
import type { FoodListing } from "@/lib/types";

const KEY = "cibo-recently-viewed";
const MAX = 8;
const EVENT = "cibo-recently-viewed-change";

export interface RecentlyViewedItem {
  id: string;
  title: string;
  image: string;
  ciboPrice: number;
  originalPrice: number;
  providerName: string;
  city: string;
  viewedAt: number;
}

function read(): RecentlyViewedItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(items: RecentlyViewedItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
  window.dispatchEvent(new Event(EVENT));
}

// Cache to avoid re-parsing on every render
let cached: RecentlyViewedItem[] | null = null;
let cachedRaw = "";

function getSnapshot(): RecentlyViewedItem[] {
  if (typeof window === "undefined") return EMPTY;
  const raw = localStorage.getItem(KEY) || "";
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cached = raw ? JSON.parse(raw) : EMPTY;
    } catch {
      cached = EMPTY;
    }
  }
  return cached || EMPTY;
}

const EMPTY: RecentlyViewedItem[] = [];

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function addRecentlyViewed(listing: FoodListing) {
  if (typeof window === "undefined") return;
  const items = read();
  const filtered = items.filter((i) => i.id !== listing.id);
  const newItem: RecentlyViewedItem = {
    id: listing.id,
    title: listing.title,
    image: listing.images?.[0] || "/cibo-logo.svg",
    ciboPrice: listing.ciboPrice,
    originalPrice: listing.originalPrice,
    providerName: listing.provider?.businessName || "Provider",
    city: listing.city,
    viewedAt: Date.now(),
  };
  write([newItem, ...filtered]);
}

export function clearRecentlyViewed() {
  write([]);
}

export function useRecentlyViewed() {
  const items = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
  const clear = useCallback(() => clearRecentlyViewed(), []);
  return { items, clear };
}
