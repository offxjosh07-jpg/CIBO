import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole, ok, err } from "@/lib/api";
import { readJsonArray } from "@/app/api/_lib/helpers";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/admin/listings/:id/takedown -> { listing }
export async function PATCH(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const { user: admin, response } = await requireRole("ADMIN", "SUPPORT");
  if (response) return response;

  const listing = await db.foodListing.findUnique({ where: { id } });
  if (!listing) return err("Listing not found", 404, "NOT_FOUND");

  let body: any = {};
  try {
    body = await _req.json().catch(() => ({}));
  } catch {
    body = {};
  }

  const provider = await db.providerProfile.findUnique({
    where: { id: listing.providerId },
    select: { userId: true },
  });

  await db.$transaction(async (tx) => {
    await tx.foodListing.update({
      where: { id },
      data: { status: "TAKEN_DOWN" },
    });
    await tx.adminAction.create({
      data: {
        adminId: admin!.id,
        targetType: "LISTING",
        targetId: id,
        action: "TAKEDOWN",
        reason: body.reason ? String(body.reason) : null,
      },
    });
    if (provider) {
      await tx.notification.create({
        data: {
          userId: provider.userId,
          type: "VERIFICATION",
          title: "Listing taken down",
          body: `Your listing "${listing.title}" has been taken down by the CIBO team.`,
          data: JSON.stringify({ listingId: id }),
        },
      });
    }
  });

  const updated = await db.foodListing.findUnique({
    where: { id },
    include: { provider: true },
  });
  return ok({
    listing: updated
      ? {
          ...updated,
          images: readJsonArray(updated.images),
          allergens: readJsonArray(updated.allergens),
        }
      : null,
  });
}
