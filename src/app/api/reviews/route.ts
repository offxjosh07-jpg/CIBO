import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser, requireRole, ok, err } from "@/lib/api";

export const runtime = "nodejs";

// GET /api/reviews?providerId=... -> { reviews, summary }
// Returns latest reviews for a provider + rating summary.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const providerId = url.searchParams.get("providerId");
  const limit = Math.min(20, Math.max(1, Number(url.searchParams.get("limit") || "10")));

  if (!providerId) return err("providerId required", 400, "BAD_PROVIDER");

  const reviews = await db.review.findMany({
    where: { providerId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  const summary = await db.review.aggregate({
    where: { providerId },
    _avg: { rating: true },
    _count: { _all: true },
  });

  // Distribution
  const distRows = await db.review.groupBy({
    by: ["rating"],
    where: { providerId },
    _count: { _all: true },
  });
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of distRows) distribution[r.rating] = r._count._all;

  return ok({
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      user: { id: r.user.id, name: r.user.name, avatarUrl: r.user.avatarUrl },
    })),
    summary: {
      average: summary._avg.rating ? Math.round(summary._avg.rating * 100) / 100 : 0,
      count: summary._count._all,
      distribution,
    },
  });
}

// POST /api/reviews { orderId, rating, comment? } -> { review }
// Only if order COMPLETED and no existing review for that order.
// Update provider rating (recompute average from totalRatings+1).
export async function POST(req: NextRequest) {
  const { user, response } = await requireRole("CUSTOMER");
  if (response) return response;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON body", 400, "BAD_BODY");
  }

  const orderId = String(body.orderId || "");
  const rating = Math.floor(Number(body.rating) || 0);
  const comment = body.comment ? String(body.comment) : null;

  if (!orderId) return err("orderId required", 400, "BAD_ORDER");
  if (rating < 1 || rating > 5)
    return err("rating must be between 1 and 5", 400, "BAD_RATING");

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || order.customerId !== user!.id) {
    return err("Order not found", 404, "NOT_FOUND");
  }
  if (order.status !== "COMPLETED") {
    return err("Order must be COMPLETED to review", 409, "NOT_COMPLETED");
  }

  const existing = await db.review.findUnique({ where: { orderId } });
  if (existing) {
    return err("Order already reviewed", 409, "ALREADY_REVIEWED");
  }

  const review = await db.$transaction(async (tx) => {
    const r = await tx.review.create({
      data: {
        userId: user!.id,
        providerId: order.providerId,
        orderId,
        rating,
        comment,
      },
    });

    // Recompute provider rating: new average = (rating * totalRatings + new) / (totalRatings + 1)
    const provider = await tx.providerProfile.findUnique({
      where: { id: order.providerId },
      select: { rating: true, totalRatings: true },
    });
    if (provider) {
      const newTotalRatings = provider.totalRatings + 1;
      const newRating =
        (provider.rating * provider.totalRatings + rating) / newTotalRatings;
      await tx.providerProfile.update({
        where: { id: order.providerId },
        data: {
          rating: Math.round(newRating * 100) / 100,
          totalRatings: newTotalRatings,
        },
      });
    }

    return r;
  });

  return ok({ review }, 201);
}
