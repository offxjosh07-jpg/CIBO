import { db } from "@/lib/db";
import { requireRole, ok } from "@/lib/api";

export const runtime = "nodejs";

// GET /api/admin/providers -> { providers } (include user)
export async function GET() {
  const { response } = await requireRole("ADMIN", "SUPPORT");
  if (response) return response;

  const providers = await db.providerProfile.findMany({
    include: { user: true, documents: true },
    orderBy: { createdAt: "desc" },
  });

  return ok({
    providers: providers.map((p: any) => {
      const { passwordHash, ...userSafe } = p.user || ({} as any);
      return { ...p, user: userSafe };
    }),
  });
}
