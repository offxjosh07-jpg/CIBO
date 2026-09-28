// Shared helpers for CIBO API routes.
// Next.js App Router only treats `route.ts` files as endpoints — other files
// in the api folder are ignored by the router, so this is a safe place for utils.

import type { User } from "@/lib/types";

type RawUser = {
  id: string;
  email: string;
  phone?: string | null;
  name: string;
  passwordHash?: string;
  role: string;
  avatarUrl?: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt?: Date | string;
};

export function sanitizeUser<T extends RawUser>(u: T): Omit<T, "passwordHash"> {
  if (!u) return u;
  const { passwordHash: _omit, ...rest } = u;
  return rest as Omit<T, "passwordHash">;
}

export function sanitizeUserOrNull<T extends RawUser>(u: T | null) {
  return u ? sanitizeUser(u) : null;
}

// Coerce a Prisma User row to the public User shape (string dates, no passwordHash).
export function toPublicUser(u: RawUser): User {
  return {
    id: u.id,
    email: u.email,
    phone: u.phone ?? undefined,
    name: u.name,
    role: u.role as User["role"],
    avatarUrl: u.avatarUrl ?? undefined,
    isActive: u.isActive,
    createdAt:
      u.createdAt instanceof Date ? u.createdAt.toISOString() : String(u.createdAt),
  };
}

export function toPublicUserOrNull(u: RawUser | null) {
  return u ? toPublicUser(u) : null;
}

// JSON string <-> array helpers for fields like images, allergens, evidence.
export function readJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

export function writeJsonArray(arr: unknown): string {
  return JSON.stringify(Array.isArray(arr) ? arr : []);
}

export function readJsonObject(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" && !Array.isArray(v)
      ? (v as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

// Parse an ISO date string OR Date — returns Date or null if invalid.
export function parseDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v === "string" || typeof v === "number") {
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}
