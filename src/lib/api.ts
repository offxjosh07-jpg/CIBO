import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromToken, SESSION_COOKIE } from "./auth";
import { db } from "./db";

export async function getToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
}

export async function getCurrentUser() {
  const token = await getToken();
  return getUserFromToken(token);
}

export type ApiUser = Awaited<ReturnType<typeof getCurrentUser>>;

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      ),
    };
  }
  return { user, response: null };
}

export async function requireRole(...roles: string[]) {
  const { user, response } = await requireUser();
  if (response) return { user: null, response };
  if (!roles.includes(user!.role)) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "Forbidden", code: "FORBIDDEN" },
        { status: 403 }
      ),
    };
  }
  return { user, response: null };
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function err(message: string, status = 400, code?: string) {
  return NextResponse.json({ error: message, code }, { status });
}

export function paginate(req: NextRequest) {
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") || "12")));
  return { page, limit, skip: (page - 1) * limit };
}

// Simple rate limiter (in-memory)
const rateMap = new Map<string, { count: number; reset: number }>();
export function rateLimit(key: string, max = 30, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry || entry.reset < now) {
    rateMap.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

// Haversine distance in km
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// JSON helpers
export function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// Validation
export function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
export function isPhone(v: string) {
  return /^[6-9]\d{9}$/.test(v.replace(/\D/g, "").slice(-10));
}
export function strongPassword(v: string) {
  return v.length >= 6;
}

// Discount percentage
export function discountPct(original: number, cibo: number) {
  if (original <= 0) return 0;
  return Math.round(((original - cibo) / original) * 100);
}

// Commission calculation
export async function getCommissionRate(): Promise<number> {
  const setting = await db.platformSetting.findUnique({
    where: { key: "commission_rate" },
  });
  return setting ? Number(setting.value) : 0.1;
}

export async function setCommissionRate(rate: number) {
  return db.platformSetting.upsert({
    where: { key: "commission_rate" },
    update: { value: String(rate) },
    create: { key: "commission_rate", value: String(rate) },
  });
}
