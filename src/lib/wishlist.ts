"use client";

import { useSyncExternalStore, useCallback } from "react";

const KEY = "cibo-wishlist";
const MAX = 50;
const EVENT = "cibo-wishlist-change";

export interface WishlistItem {
  id: string;
  title: string;
  image: string;
  ciboPrice: number;
  originalPrice: number;
  providerName: string;
  city: string;
  addedAt: number;
}

function read(): WishlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(items: WishlistItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
  window.dispatchEvent(new Event(EVENT));
}

let cached: WishlistItem[] | null = null;
let cachedRaw = "";
const EMPTY: WishlistItem[] = [];

function getSnapshot(): WishlistItem[] {
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

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function addToWishlist(item: Omit<WishlistItem, "addedAt">) {
  const items = read().filter((i) => i.id !== item.id);
  write([{ ...item, addedAt: Date.now() }, ...items]);
}

export function removeFromWishlist(id: string) {
  write(read().filter((i) => i.id !== id));
}

export function isInWishlist(id: string): boolean {
  return read().some((i) => i.id === id);
}

export function clearWishlist() {
  write([]);
}

export function useWishlist() {
  const items = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
  const add = useCallback((item: Omit<WishlistItem, "addedAt">) => addToWishlist(item), []);
  const remove = useCallback((id: string) => removeFromWishlist(id), []);
  const clear = useCallback(() => clearWishlist(), []);
  const has = useCallback((id: string) => items.some((i) => i.id === id), [items]);
  return { items, add, remove, clear, has, count: items.length };
}
