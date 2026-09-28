import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole, ok, err } from "@/lib/api";
import { readJsonArray, writeJsonArray, parseDate } from "@/app/api/_lib/helpers";

export const runtime = "nodejs";

const FOOD_TYPES = new Set(["VEG", "NON_VEG", "EGG", "VEGAN", "JAIN"]);
const HALAL_STATUSES = new Set(["VERIFIED", "DECLARED", "UNSPECIFIED"]);
const FULFILLMENT_TYPES = new Set(["PICKUP", "DELIVERY", "BOTH"]);
const LISTING_STATUSES = new Set(["DRAFT", "ACTIVE", "SOLD_OUT"]);

// GET /api/provider/listings -> { listings } (own listings only)
export async function GET() {
  const { user, response } = await requireRole("PROVIDER");
  if (response) return response;

  const provider = await db.providerProfile.findUnique({
    where: { userId: user!.id },
  });
  if (!provider) return err("Provider profile not found", 404, "NO_PROVIDER");

  const listings = await db.foodListing.findMany({
    where: { providerId: provider.id },
    include: { category: true },
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

// POST /api/provider/listings (data) -> { listing }
// Creates a FoodListing + FoodSafetyReport. initialQuantity = quantity.
export async function POST(req: NextRequest) {
  const { user, response } = await requireRole("PROVIDER");
  if (response) return response;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON body", 400, "BAD_BODY");
  }

  const provider = await db.providerProfile.findUnique({
    where: { userId: user!.id },
  });
  if (!provider) return err("Provider profile not found", 404, "NO_PROVIDER");

  const title = String(body.title || "").trim();
  const description = String(body.description || "").trim();
  const foodType = String(body.foodType || "VEG").toUpperCase();
  const halalStatus = String(body.halalStatus || "UNSPECIFIED").toUpperCase();
  const quantity = body.quantity != null ? Number(body.quantity) : NaN;
  const originalPrice = body.originalPrice != null ? Number(body.originalPrice) : NaN;
  const ciboPrice = body.ciboPrice != null ? Number(body.ciboPrice) : NaN;
  const prepTime = body.prepTime != null ? String(body.prepTime) : null;
  const packingTime = body.packingTime != null ? String(body.packingTime) : null;
  const pickupStart = parseDate(body.pickupStart);
  const pickupDeadline = parseDate(body.pickupDeadline);
  const addressLine = String(body.addressLine || "").trim();
  const city = String(body.city || provider.city).trim();
  const latitude = body.latitude != null ? Number(body.latitude) : provider.latitude;
  const longitude = body.longitude != null ? Number(body.longitude) : provider.longitude;
  const allergens = body.allergens;
  const images = body.images;
  const storageInfo = body.storageInfo != null ? String(body.storageInfo) : null;
  const packagingInfo = body.packagingInfo != null ? String(body.packagingInfo) : null;
  const specialInstructions =
    body.specialInstructions != null ? String(body.specialInstructions) : null;
  const isEvent = Boolean(body.isEvent);
  const eventType = body.eventType != null ? String(body.eventType) : null;
  const eventName = body.eventName != null ? String(body.eventName) : null;
  const fulfillment = String(body.fulfillment || "PICKUP").toUpperCase();
  const deliveryFee = body.deliveryFee != null ? Number(body.deliveryFee) : 0;
  const status = String(body.status || "ACTIVE").toUpperCase();
  const categoryId = body.categoryId ? String(body.categoryId) : null;
  const safetyDeclaration = Boolean(body.safetyDeclaration);

  // Validation
  if (!title) return err("Title required", 400, "BAD_TITLE");
  if (!description) return err("Description required", 400, "BAD_DESC");
  if (!FOOD_TYPES.has(foodType)) return err("Invalid foodType", 400, "BAD_FOOD_TYPE");
  if (!HALAL_STATUSES.has(halalStatus)) return err("Invalid halalStatus", 400, "BAD_HALAL");
  if (!Number.isInteger(quantity) || quantity < 0)
    return err("quantity must be a non-negative integer", 400, "BAD_QTY");
  if (isNaN(originalPrice) || originalPrice < 0)
    return err("originalPrice required", 400, "BAD_PRICE");
  if (isNaN(ciboPrice) || ciboPrice < 0)
    return err("ciboPrice required", 400, "BAD_CIBO_PRICE");
  if (ciboPrice > originalPrice)
    return err("ciboPrice cannot exceed originalPrice", 400, "BAD_PRICE");
  if (!pickupStart) return err("pickupStart required", 400, "BAD_PICKUP_START");
  if (!pickupDeadline) return err("pickupDeadline required", 400, "BAD_PICKUP_DEADLINE");
  if (pickupDeadline <= pickupStart)
    return err("pickupDeadline must be after pickupStart", 400, "BAD_DEADLINE");
  if (!addressLine) return err("addressLine required", 400, "BAD_ADDRESS");
  if (!city) return err("city required", 400, "BAD_CITY");
  if (isNaN(latitude) || isNaN(longitude))
    return err("Invalid coordinates", 400, "BAD_COORDS");
  if (!FULFILLMENT_TYPES.has(fulfillment))
    return err("Invalid fulfillment", 400, "BAD_FULFILLMENT");
  if (isNaN(deliveryFee) || deliveryFee < 0)
    return err("Invalid deliveryFee", 400, "BAD_DELIVERY_FEE");
  if (!LISTING_STATUSES.has(status)) return err("Invalid status", 400, "BAD_STATUS");

  // ACTIVE listings must have a future pickup deadline.
  if (status === "ACTIVE" && pickupDeadline <= new Date()) {
    return err("pickupDeadline must be in the future for ACTIVE listings", 400, "PAST_DEADLINE");
  }

  // Category existence
  if (categoryId) {
    const cat = await db.foodCategory.findUnique({ where: { id: categoryId } });
    if (!cat) return err("Category not found", 400, "BAD_CATEGORY");
  }

  const created = await db.$transaction(async (tx) => {
    const listing = await tx.foodListing.create({
      data: {
        providerId: provider.id,
        categoryId,
        title,
        description,
        images: writeJsonArray(images),
        foodType,
        halalStatus,
        quantity,
        originalPrice,
        ciboPrice,
        prepTime,
        packingTime,
        pickupStart,
        pickupDeadline,
        addressLine,
        city,
        latitude,
        longitude,
        distanceKm: 0,
        allergens: writeJsonArray(allergens),
        storageInfo,
        packagingInfo,
        specialInstructions,
        isEvent,
        eventType,
        eventName,
        fulfillment,
        deliveryFee,
        status,
        initialQuantity: quantity,
      },
      include: { category: true, provider: true },
    });

    // Always create a FoodSafetyReport alongside the listing.
    await tx.foodSafetyReport.create({
      data: {
        listingId: listing.id,
        providerId: provider.id,
        prepTime,
        packingTime,
        storageInfo,
        packagingStatus: packagingInfo,
        handlingDeclaration: specialInstructions,
        allergenInfo: writeJsonArray(allergens),
        safetyDeclaration,
      },
    });

    return listing;
  });

  return ok(
    {
      listing: {
        ...created,
        images: readJsonArray(created.images),
        allergens: readJsonArray(created.allergens),
      },
    },
    201
  );
}
