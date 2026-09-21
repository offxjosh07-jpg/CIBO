import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser, ok, err } from "@/lib/api";
import { readJsonArray, writeJsonArray } from "@/app/api/_lib/helpers";

export const runtime = "nodejs";

const COMPLAINT_TYPES = new Set([
  "FOOD_QUALITY",
  "MISSING_ITEM",
  "WRONG_QUANTITY",
  "LATE_PICKUP",
  "FOOD_SAFETY",
  "PROVIDER_BEHAVIOR",
  "PAYMENT",
  "OTHER",
]);

// GET /api/complaints -> { complaints } (current user's)
export async function GET() {
  const { user, response } = await requireUser();
  if (response) return response;

  const complaints = await db.complaint.findMany({
    where: { userId: user!.id },
    orderBy: { createdAt: "desc" },
  });

  return ok({
    complaints: complaints.map((c: any) => ({
      ...c,
      evidence: readJsonArray(c.evidence),
    })),
  });
}

// POST /api/complaints { orderId?, providerId?, listingId?, type, description } -> { complaint }
export async function POST(req: NextRequest) {
  const { user, response } = await requireUser();
  if (response) return response;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON body", 400, "BAD_BODY");
  }

  const type = String(body.type || "").toUpperCase();
  const description = String(body.description || "").trim();
  const orderId = body.orderId ? String(body.orderId) : null;
  const providerId = body.providerId ? String(body.providerId) : null;
  const listingId = body.listingId ? String(body.listingId) : null;
  const evidence = Array.isArray(body.evidence) ? body.evidence : [];

  if (!COMPLAINT_TYPES.has(type)) return err("Invalid complaint type", 400, "BAD_TYPE");
  if (!description || description.length < 5)
    return err("Description required (min 5 chars)", 400, "BAD_DESC");

  // Optional cross-checks + auto-derive providerId from order
  let effectiveProviderId = providerId;
  if (orderId) {
    const o = await db.order.findUnique({ where: { id: orderId } });
    if (!o || o.customerId !== user!.id) {
      return err("Order not found for this user", 404, "ORDER_NOT_FOUND");
    }
    if (!effectiveProviderId) effectiveProviderId = o.providerId;
  }
  if (effectiveProviderId) {
    const prov = await db.providerProfile.findUnique({
      where: { id: effectiveProviderId },
      select: { id: true },
    });
    if (!prov) return err("Provider not found", 404, "PROVIDER_NOT_FOUND");
  }
  if (listingId) {
    const lst = await db.foodListing.findUnique({
      where: { id: listingId },
      select: { id: true },
    });
    if (!lst) return err("Listing not found", 404, "LISTING_NOT_FOUND");
  }

  const complaint = await db.complaint.create({
    data: {
      userId: user!.id,
      orderId,
      providerId: effectiveProviderId,
      listingId,
      type,
      description,
      evidence: writeJsonArray(evidence),
      status: "OPEN",
    },
  });

  return ok(
    {
      complaint: {
        ...complaint,
        evidence: readJsonArray(complaint.evidence),
      },
    },
    201
  );
}
