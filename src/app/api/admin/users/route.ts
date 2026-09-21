import { db } from "@/lib/db";
import { requireRole, ok } from "@/lib/api";
import { toPublicUser } from "@/app/api/_lib/helpers";

export const runtime = "nodejs";

// GET /api/admin/users -> { users } (include providerProfile if PROVIDER)
export async function GET() {
  const { response } = await requireRole("ADMIN", "SUPPORT");
  if (response) return response;

  const users = await db.user.findMany({
    include: {
      providerProfile: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return ok({
    users: users.map((u: any) => ({
      ...toPublicUser(u),
      provider: u.providerProfile || null,
    })),
  });
}
