import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, isEmail, rateLimit, setSessionCookie } from "@/lib/api";
import { verifyPassword, createSession } from "@/lib/auth";
import { toPublicUserOrNull, getClientIp } from "@/app/api/_lib/helpers";

export const runtime = "nodejs";

// POST /api/auth/login { email, password } -> { user }
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(`login:${ip}`, 20, 60_000)) {
    return err("Too many attempts. Try again later.", 429, "RATE_LIMITED");
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON body", 400, "BAD_BODY");
  }

  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!isEmail(email)) return err("Valid email is required", 400, "BAD_EMAIL");
  if (!password) return err("Password is required", 400, "BAD_PASSWORD");

  const user = await db.user.findUnique({ where: { email } });

  // Run verify against a properly-formatted dummy hash when user missing,
  // to reduce timing leakage. Format: salt(32 hex chars):hash(128 hex chars).
  const DUMMY_HASH = `${"0".repeat(32)}:${"0".repeat(128)}`;
  const storedHash = user?.passwordHash || DUMMY_HASH;
  const valid = verifyPassword(password, storedHash);

  if (!user || !valid) {
    return err("Invalid email or password", 401, "BAD_CREDENTIALS");
  }
  if (!user.isActive) {
    return err("Account suspended. Contact support.", 403, "SUSPENDED");
  }

  const token = await createSession(user.id);
  await setSessionCookie(token);

  return ok({ user: toPublicUserOrNull(user) });
}
