import { db } from "@/lib/db";
import { requireUser, ok } from "@/lib/api";
import { readJsonObject } from "@/app/api/_lib/helpers";

export const runtime = "nodejs";

// GET /api/notifications -> { notifications } (current user's, newest first)
export async function GET() {
  const { user, response } = await requireUser();
  if (response) return response;

  const notifications = await db.notification.findMany({
    where: { userId: user!.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return ok({
    notifications: notifications.map((n: any) => ({
      ...n,
      data: readJsonObject(n.data),
    })),
  });
}
