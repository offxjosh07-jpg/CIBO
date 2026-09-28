import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, haversineKm, discountPct, paginate } from "@/lib/api";
import { readJsonArray } from "@/app/api/_lib/helpers";

export const runtime = "nodejs";

const ALLOWED_SORT = new Set([
  "nearest",
  "price_low",
  "discount",
  "ending_soon",
  "recent",
]);

// GET /api/listings?... -> { listings, total }
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const p = url.searchParams;

  const city = p.get("city") || undefined;
  const lat = p.get("lat") ? Number(p.get("lat")) : undefined;
  const lng = p.get("lng") ? Number(p.get("lng")) : undefined;
  const radiusKm = p.get("radiusKm") ? Number(p.get("radiusKm")) : undefined;
  const q = p.get("q") || undefined;
  const foodType = p.get("foodType") || undefined;
  const halal = p.get("halal") || undefined;
  const category = p.get("category") || undefined;
  const isEvent = p.get("isEvent");
  const sort = p.get("sort") || undefined;
  const maxPrice = p.get("maxPrice") ? Number(p.get("maxPrice")) : undefined;
  const minDiscount = p.get("minDiscount") ? Number(p.get("minDiscount")) : undefined;
  const statusParam = p.get("status") || undefined;
  const providerId = p.get("providerId") || undefined;

  // Validate lat/lng
  if ((lat != null && isNaN(lat)) || (lng != null && isNaN(lng))) {
    return err("Invalid lat/lng", 400, "BAD_COORDS");
  }
  if (radiusKm != null && isNaN(radiusKm)) {
    return err("Invalid radiusKm", 400, "BAD_RADIUS");
  }

  // Status filter: default ACTIVE; EXPIRED/TAKEN_DOWN only if explicitly requested.
  const status = statusParam || "ACTIVE";
  const now = new Date();

  // Auto-expire: any ACTIVE listing whose pickup deadline passed becomes EXPIRED.
  // Run as a background fire-and-forget (don't block the response).
  db.foodListing
    .updateMany({
      where: { status: "ACTIVE", pickupDeadline: { lte: now } },
      data: { status: "EXPIRED" },
    })
    .catch(() => {});

  // Sort resolution
  let effectiveSort = sort || (lat != null && lng != null ? "nearest" : "recent");
  if (!ALLOWED_SORT.has(effectiveSort)) effectiveSort = "recent";

  // Category -> resolve to a category id (by slug OR id).
  let categoryId: string | undefined;
  if (category) {
    const cat = await db.foodCategory.findFirst({
      where: { OR: [{ slug: category }, { id: category }] },
      select: { id: true },
    });
    if (cat) categoryId = cat.id;
  }

  // Build where clause
  const where: any = {
    status,
  };
  // For ACTIVE listings, always require a future pickup deadline (auto-expiry safety).
  if (status === "ACTIVE") {
    where.pickupDeadline = { gt: now };
  }
  if (city) where.city = city;
  if (foodType) where.foodType = foodType;
  if (providerId) where.providerId = providerId;
  if (categoryId) where.categoryId = categoryId;
  if (isEvent === "true" || isEvent === "1") where.isEvent = true;
  if (isEvent === "false" || isEvent === "0") where.isEvent = false;
  if (maxPrice != null && !isNaN(maxPrice)) where.ciboPrice = { lte: maxPrice };
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
    ];
  }
  if (halal === "verified") {
    where.halalStatus = "VERIFIED";
  } else if (halal === "declared") {
    where.halalStatus = { in: ["VERIFIED", "DECLARED"] };
  }

  // Fetch all matching listings (we'll filter/sort/paginate in memory for distance+discount).
  const listings = await db.foodListing.findMany({
    where,
    include: {
      provider: true,
      category: true,
    },
  });

  // Deserialize JSON fields + compute distanceKm if lat/lng given.
  const enriched = listings.map((l: any) => {
    const images = readJsonArray(l.images);
    const allergens = readJsonArray(l.allergens);
    let distanceKm = l.distanceKm;
    if (lat != null && lng != null) {
      distanceKm = haversineKm(lat, lng, l.latitude, l.longitude);
    }
    return {
      ...l,
      images,
      allergens,
      distanceKm: Math.round(distanceKm * 100) / 100,
    };
  });

  // radiusKm filter (in-memory)
  let filtered = enriched;
  if (radiusKm != null && lat != null && lng != null) {
    filtered = filtered.filter((l: any) => l.distanceKm <= radiusKm);
  }

  // minDiscount filter (in-memory)
  if (minDiscount != null && !isNaN(minDiscount)) {
    filtered = filtered.filter(
      (l: any) =>
        discountPct(l.originalPrice, l.ciboPrice) >= minDiscount
    );
  }

  // Sort
  const sorted = [...filtered];
  switch (effectiveSort) {
    case "nearest":
      sorted.sort((a: any, b: any) => a.distanceKm - b.distanceKm);
      break;
    case "price_low":
      sorted.sort((a: any, b: any) => a.ciboPrice - b.ciboPrice);
      break;
    case "discount":
      sorted.sort(
        (a: any, b: any) =>
          discountPct(b.originalPrice, b.ciboPrice) -
          discountPct(a.originalPrice, a.ciboPrice)
      );
      break;
    case "ending_soon":
      sorted.sort(
        (a: any, b: any) =>
          new Date(a.pickupDeadline).getTime() - new Date(b.pickupDeadline).getTime()
      );
      break;
    case "recent":
    default:
      sorted.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      break;
  }

  const total = sorted.length;

  // Paginate
  const { skip, limit } = paginate(req);
  const paged = sorted.slice(skip, skip + limit);

  return ok({ listings: paged, total });
}
