import { db } from "@/lib/db";
import { requireUser, ok, clearSessionCookie } from "@/lib/api";
import { toPublicUserOrNull } from "@/app/api/_lib/helpers";

export const runtime = "nodejs";

// GET /api/auth/me -> { user: User | null }
// Returns null (status 200) when not logged in — never 401.
export async function GET() {
  const { user } = await requireUser();
  return ok({ user: toPublicUserOrNull(user) }, 200);
}
