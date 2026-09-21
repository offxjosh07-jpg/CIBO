import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fmtPrice(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export function discountPct(original: number, cibo: number): number {
  if (original <= 0) return 0;
  return Math.round(((original - cibo) / original) * 100);
}

export function fmtTime(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}

export function fmtDate(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function fmtDateTime(d: string | Date): string {
  return `${fmtDate(d)}, ${fmtTime(d)}`;
}

export function timeAgo(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d2 = Math.floor(h / 24);
  if (d2 < 30) return `${d2}d ago`;
  return fmtDate(date);
}

export function minsUntil(d: string | Date): number {
  const date = typeof d === "string" ? new Date(d) : d;
  return Math.max(0, Math.round((date.getTime() - Date.now()) / 60000));
}

export function deadlineLabel(d: string | Date): string {
  const mins = minsUntil(d);
  if (mins <= 0) return "Pickup closed";
  if (mins <= 30) return `Closes in ${mins}m`;
  if (mins <= 90) return `${mins}m left`;
  const h = Math.floor(mins / 60);
  return `${h}h ${mins % 60}m left`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
