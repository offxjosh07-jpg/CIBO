"use client";

import { useState, useSyncExternalStore, useCallback } from "react";
import { ExploreLayout } from "./explore-view";
import { useApp } from "@/lib/store";
import { PageShell } from "./shared";
import { Search, TrendingUp, Clock, X, Flame } from "lucide-react";

const RECENT_KEY = "cibo-recent-searches";
const MAX_RECENT = 8;
const EVENT = "cibo-recent-searches-change";

const TRENDING = [
  "biryani",
  "veg meals",
  "pizza",
  "bakery",
  "dosa",
  "wedding",
  "cakes",
  "snacks",
];

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeRecent(items: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(RECENT_KEY, JSON.stringify(items.slice(0, MAX_RECENT)));
  window.dispatchEvent(new Event(EVENT));
}

let cached: string[] | null = null;
let cachedRaw = "";
const EMPTY: string[] = [];

function getSnapshot(): string[] {
  if (typeof window === "undefined") return EMPTY;
  const raw = localStorage.getItem(RECENT_KEY) || "";
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

export function addRecentSearch(q: string) {
  const trimmed = q.trim();
  if (!trimmed || trimmed.length < 2) return;
  const items = readRecent().filter((i) => i.toLowerCase() !== trimmed.toLowerCase());
  writeRecent([trimmed, ...items]);
}

export function SearchView() {
  const recent = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
  const [activeQuery, setActiveQuery] = useState("");

  const clearRecent = useCallback(() => writeRecent([]), []);

  const pickQuery = (q: string) => {
    setActiveQuery(q);
  };

  const hasRecentOrTrending = recent.length > 0 || TRENDING.length > 0;

  return (
    <PageShell className="space-y-4">
      {/* Recent & Trending chips */}
      {hasRecentOrTrending && (
        <div className="space-y-4">
          {recent.length > 0 && (
            <div>
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-forest">
                  <Clock className="size-3.5 text-gold" /> Recent searches
                </h3>
                <button
                  onClick={clearRecent}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition hover:text-danger"
                >
                  <X className="size-3" /> Clear
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {recent.map((q) => (
                  <button
                    key={q}
                    onClick={() => pickQuery(q)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-forest/10 bg-card px-3 py-1.5 text-xs font-medium text-forest transition hover:border-gold hover:bg-cream/40"
                  >
                    <Clock className="size-3 text-muted-foreground" />
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-forest">
              <Flame className="size-3.5 text-orange" /> Trending searches
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {TRENDING.map((q) => (
                <button
                  key={q}
                  onClick={() => pickQuery(q)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-orange/20 bg-orange/5 px-3 py-1.5 text-xs font-medium text-forest transition hover:border-orange hover:bg-orange/10"
                >
                  <TrendingUp className="size-3 text-orange" />
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <ExploreLayout
        title="Search"
        subtitle="Find your next food rescue"
        initialQ={activeQuery}
        onSearchCommit={addRecentSearch}
      />
    </PageShell>
  );
}
