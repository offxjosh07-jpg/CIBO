import { db } from "@/lib/db";
import { requireRole, ok } from "@/lib/api";
import { toPublicUser, readJsonArray } from "@/app/api/_lib/helpers";

export const runtime = "nodejs";

// GET /api/admin/complaints -> { complaints } (include user, provider, order, listing)
export async function GET() {
  const { response } = await requireRole("ADMIN", "SUPPORT");
  if (response) return response;

  const complaints = await db.complaint.findMany({
    include: {
      user: true,
      provider: true,
      order: { include: { items: true } },
      listing: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return ok({
    complaints: complaints.map((c: any) => ({
      ...c,
      evidence: readJsonArray(c.evidence),
      user: c.user ? toPublicUser(c.user) : null,
      listing: c.listing
        ? {
            ...c.listing,
            images: readJsonArray(c.listing.images),
            allergens: readJsonArray(c.listing.allergens),
          }
        : null,
    })),
  });
}
