import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole, ok, err } from "@/lib/api";
import { readJsonArray, writeJsonArray, parseDate } from "@/app/api/_lib/helpers";

export const runtime = "nodejs";

const FOOD_TYPES = new Set(["VEG", "NON_VEG", "EGG", "VEGAN", "JAIN"]);
const HALAL_STATUSES = new Set(["VERIFIED", "DECLARED", "UNSPECIFIED"]);
const FULFILLMENT_TYPES = new Set(["PICKUP", "DELIVERY", "BOTH"]);
const LISTING_STATUSES = new Set(["DRAFT", "ACTIVE", "SOLD_OUT", "EXPIRED", "TAKEN_DOWN"]);

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/provider/listings/:id (data) -> { listing }
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const { user, response } = await requireRole("PROVIDER");
  if (response) return response;

  const provider = await db.providerProfile.findUnique({
    where: { userId: user!.id },
  });
  if (!provider) return err("Provider profile not found", 404, "NO_PROVIDER");

  const existing = await db.foodListing.findUnique({ where: { id } });
  if (!existing || existing.providerId !== provider.id) {
    return err("Listing not found", 404, "NOT_FOUND");
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON body", 400, "BAD_BODY");
  }

  const data: any = {};
  if (body.title != null) data.title = String(body.title).trim();
  if (body.description != null) data.description = String(body.description).trim();
  if (body.foodType != null) {
    const t = String(body.foodType).toUpperCase();
    if (!FOOD_TYPES.has(t)) return err("Invalid foodType", 400, "BAD_FOOD_TYPE");
    data.foodType = t;
  }
  if (body.halalStatus != null) {
    const t = String(body.halalStatus).toUpperCase();
    if (!HALAL_STATUSES.has(t)) return err("Invalid halalStatus", 400, "BAD_HALAL");
    data.halalStatus = t;
  }
  if (body.quantity != null) {
    const q = Number(body.quantity);
    if (!Number.isInteger(q) || q < 0) return err("Invalid quantity", 400, "BAD_QTY");
    data.quantity = q;
    // If quantity increases above 0 and listing was SOLD_OUT, revive to ACTIVE.
    if (q > 0 && existing.status === "SOLD_OUT") {
      data.status = "ACTIVE";
    }
    if (q === 0 && existing.status === "ACTIVE") {
      data.status = "SOLD_OUT";
    }
  }
  if (body.originalPrice != null) {
    const v = Number(body.originalPrice);
    if (isNaN(v) || v < 0) return err("Invalid originalPrice", 400, "BAD_PRICE");
    data.originalPrice = v;
  }
  if (body.ciboPrice != null) {
    const v = Number(body.ciboPrice);
    if (isNaN(v) || v < 0) return err("Invalid ciboPrice", 400, "BAD_CIBO_PRICE");
    data.ciboPrice = v;
  }
  if (body.prepTime != null) data.prepTime = body.prepTime ? String(body.prepTime) : null;
  if (body.packingTime != null) data.packingTime = body.packingTime ? String(body.packingTime) : null;
  if (body.pickupStart != null) {
    const d = parseDate(body.pickupStart);
    if (!d) return err("Invalid pickupStart", 400, "BAD_PICKUP_START");
    data.pickupStart = d;
  }
  if (body.pickupDeadline != null) {
    const d = parseDate(body.pickupDeadline);
    if (!d) return err("Invalid pickupDeadline", 400, "BAD_PICKUP_DEADLINE");
    data.pickupDeadline = d;
  }
  if (body.addressLine != null) data.addressLine = String(body.addressLine).trim();
  if (body.city != null) data.city = String(body.city).trim();
  if (body.latitude != null) {
    const v = Number(body.latitude);
    if (isNaN(v)) return err("Invalid latitude", 400, "BAD_COORDS");
    data.latitude = v;
  }
  if (body.longitude != null) {
    const v = Number(body.longitude);
    if (isNaN(v)) return err("Invalid longitude", 400, "BAD_COORDS");
    data.longitude = v;
  }
  if (body.allergens != null) data.allergens = writeJsonArray(body.allergens);
  if (body.images != null) data.images = writeJsonArray(body.images);
  if (body.storageInfo != null) data.storageInfo = body.storageInfo ? String(body.storageInfo) : null;
  if (body.packagingInfo != null) data.packagingInfo = body.packagingInfo ? String(body.packagingInfo) : null;
  if (body.specialInstructions != null)
    data.specialInstructions = body.specialInstructions ? String(body.specialInstructions) : null;
  if (body.isEvent != null) data.isEvent = Boolean(body.isEvent);
  if (body.eventType != null) data.eventType = body.eventType ? String(body.eventType) : null;
  if (body.eventName != null) data.eventName = body.eventName ? String(body.eventName) : null;
  if (body.fulfillment != null) {
    const t = String(body.fulfillment).toUpperCase();
    if (!FULFILLMENT_TYPES.has(t)) return err("Invalid fulfillment", 400, "BAD_FULFILLMENT");
    data.fulfillment = t;
  }
  if (body.deliveryFee != null) {
    const v = Number(body.deliveryFee);
    if (isNaN(v) || v < 0) return err("Invalid deliveryFee", 400, "BAD_DELIVERY_FEE");
    data.deliveryFee = v;
  }
  if (body.status != null) {
    const t = String(body.status).toUpperCase();
    if (!LISTING_STATUSES.has(t)) return err("Invalid status", 400, "BAD_STATUS");
    data.status = t;
  }
  if (body.categoryId !== undefined) {
    if (body.categoryId === null) {
      data.categoryId = null;
    } else {
      const catId = String(body.categoryId);
      const cat = await db.foodCategory.findUnique({ where: { id: catId } });
      if (!cat) return err("Category not found", 400, "BAD_CATEGORY");
      data.categoryId = catId;
    }
  }

  // ACTIVE listings must have a future pickup deadline.
  const finalStatus = data.status || existing.status;
  const finalDeadline = data.pickupDeadline || existing.pickupDeadline;
  if (finalStatus === "ACTIVE" && finalDeadline <= new Date()) {
    return err("pickupDeadline must be in the future for ACTIVE listings", 400, "PAST_DEADLINE");
  }

  const updated = await db.foodListing.update({
    where: { id },
    data,
    include: { category: true, provider: true },
  });

  return ok({
    listing: {
      ...updated,
      images: readJsonArray(updated.images),
      allergens: readJsonArray(updated.allergens),
    },
  });
}

// DELETE /api/provider/listings/:id -> { ok: true } (only if no active orders)
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const { user, response } = await requireRole("PROVIDER");
  if (response) return response;

  const provider = await db.providerProfile.findUnique({
    where: { userId: user!.id },
  });
  if (!provider) return err("Provider profile not found", 404, "NO_PROVIDER");

  const existing = await db.foodListing.findUnique({ where: { id } });
  if (!existing || existing.providerId !== provider.id) {
    return err("Listing not found", 404, "NOT_FOUND");
  }

  // Block delete if there are active (non-terminal) orders referencing this listing.
  const activeOrders = await db.orderItem.count({
    where: {
      listingId: id,
      order: {
        status: { in: ["PLACED", "CONFIRMED", "READY", "PICKED_UP"] },
      },
    },
  });
  if (activeOrders > 0) {
    return err(
      "Cannot delete listing with active orders. Mark it as TAKEN_DOWN instead.",
      409,
      "HAS_ACTIVE_ORDERS"
    );
  }

  await db.foodListing.delete({ where: { id } });
  return ok({ ok: true });
}
