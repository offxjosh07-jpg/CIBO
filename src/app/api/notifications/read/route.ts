import { db } from "@/lib/db";
import { requireUser, ok } from "@/lib/api";

export const runtime = "nodejs";

// POST /api/notifications/read -> { ok: true }  (mark all read)
export async function POST() {
  const { user, response } = await requireUser();
  if (response) return response;

  await db.notification.updateMany({
    where: { userId: user!.id, read: false },
    data: { read: true },
  });

  return ok({ ok: true });
}
