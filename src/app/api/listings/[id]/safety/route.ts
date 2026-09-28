import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/listings/:id/safety -> { report }
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const report = await db.foodSafetyReport.findFirst({
    where: { listingId: id },
  });
  if (!report) return err("Safety report not found", 404, "NOT_FOUND");
  return ok({ report });
}
