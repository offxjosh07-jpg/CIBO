import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import { readJsonArray } from "@/app/api/_lib/helpers";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/listings/:id -> { listing }  (increments views)
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const listing = await db.foodListing.findUnique({
    where: { id },
    include: { provider: true, category: true },
  });
  if (!listing) return err("Listing not found", 404, "NOT_FOUND");

  // Auto-expire: if ACTIVE but deadline passed, mark EXPIRED.
  let effectiveStatus = listing.status;
  if (listing.status === "ACTIVE" && listing.pickupDeadline <= new Date()) {
    effectiveStatus = "EXPIRED";
    await db.foodListing.update({ where: { id }, data: { status: "EXPIRED" } }).catch(() => {});
  }

  // Increment views (best-effort, non-blocking).
  await db.foodListing
    .update({ where: { id }, data: { views: { increment: 1 } } })
    .catch(() => {});

  return ok({
    listing: {
      ...listing,
      status: effectiveStatus,
      images: readJsonArray(listing.images),
      allergens: readJsonArray(listing.allergens),
    },
  });
}
