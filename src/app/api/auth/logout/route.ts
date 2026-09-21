import { NextRequest } from "next/server";
import { ok, clearSessionCookie, getToken } from "@/lib/api";
import { destroySession } from "@/lib/auth";

export const runtime = "nodejs";

// POST /api/auth/logout -> { ok: true }
export async function POST(_req: NextRequest) {
  const token = await getToken();
  if (token) {
    await destroySession(token);
  }
  await clearSessionCookie();
  return ok({ ok: true });
}
