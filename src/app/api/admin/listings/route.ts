import { db } from "@/lib/db";
import { requireRole, ok } from "@/lib/api";
import { readJsonArray } from "@/app/api/_lib/helpers";

export const runtime = "nodejs";

// GET /api/admin/listings -> { listings } (include provider)
export async function GET() {
  const { response } = await requireRole("ADMIN", "SUPPORT");
  if (response) return response;

  const listings = await db.foodListing.findMany({
    include: { provider: true, category: true },
    orderBy: { createdAt: "desc" },
  });

  return ok({
    listings: listings.map((l: any) => ({
      ...l,
      images: readJsonArray(l.images),
      allergens: readJsonArray(l.allergens),
    })),
  });
}
