import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole, ok, err } from "@/lib/api";
import { readJsonArray } from "@/app/api/_lib/helpers";

export const runtime = "nodejs";

// GET /api/favorites -> { favorites } (include listing with provider)
export async function GET() {
  const { user, response } = await requireRole("CUSTOMER");
  if (response) return response;

  const favorites = await db.favorite.findMany({
    where: { userId: user!.id, listingId: { not: null } },
    include: {
      listing: {
        include: { provider: true, category: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok({
    favorites: favorites.map((f: any) => ({
      ...f,
      listing: f.listing
        ? {
            ...f.listing,
            images: readJsonArray(f.listing.images),
            allergens: readJsonArray(f.listing.allergens),
          }
        : null,
    })),
  });
}

// POST /api/favorites { listingId } -> { fav: boolean }  (toggle)
export async function POST(req: NextRequest) {
  const { user, response } = await requireRole("CUSTOMER");
  if (response) return response;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON body", 400, "BAD_BODY");
  }

  const listingId = String(body.listingId || "");
  if (!listingId) return err("listingId required", 400, "BAD_LISTING");

  const listing = await db.foodListing.findUnique({ where: { id: listingId } });
  if (!listing) return err("Listing not found", 404, "NOT_FOUND");

  const existing = await db.favorite.findUnique({
    where: {
      userId_listingId: { userId: user!.id, listingId },
    },
  });

  if (existing) {
    await db.favorite.delete({ where: { id: existing.id } });
    return ok({ fav: false });
  }

  await db.favorite.create({
    data: {
      userId: user!.id,
      listingId,
      type: "LISTING",
    },
  });
  return ok({ fav: true });
}
