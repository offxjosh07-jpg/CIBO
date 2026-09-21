import { db } from "@/lib/db";
import crypto from "crypto";

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

// Simple, safe password hashing using Node crypto (PBKDF2)
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const verify = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(verify, "hex"));
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createSession(userId: string): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await db.session.create({
    data: { userId, token, expiresAt },
  });
  return token;
}

export async function getUserFromToken(token: string | undefined) {
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  if (!session.user.isActive) return null;
  return session.user;
}

export async function destroySession(token: string) {
  await db.session.deleteMany({ where: { token } }).catch(() => {});
}

export const SESSION_COOKIE = "cibo_session";

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
    secure: process.env.NODE_ENV === "production",
  };
}

// OTP for pickup
export function generateOtp(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Order number
export async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await db.order.count();
  const seq = String(count + 124).padStart(6, "0");
  return `CIBO-${year}-${seq}`;
}

// Role check helper
export type Role = "CUSTOMER" | "PROVIDER" | "ADMIN" | "SUPPORT";
export function hasRole(userRole: string, ...allowed: Role[]) {
  return allowed.includes(userRole as Role);
}
