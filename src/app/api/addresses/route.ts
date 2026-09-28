import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser, ok, err } from "@/lib/api";

export const runtime = "nodejs";

// GET /api/addresses -> { addresses }
export async function GET() {
  const { user, response } = await requireUser();
  if (response) return response;

  const addresses = await db.address.findMany({
    where: { userId: user!.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return ok({ addresses });
}

// POST /api/addresses (data) -> { address }
export async function POST(req: NextRequest) {
  const { user, response } = await requireUser();
  if (response) return response;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON body", 400, "BAD_BODY");
  }

  const label = String(body.label || "Home").trim();
  const line1 = String(body.line1 || "").trim();
  const line2 = body.line2 ? String(body.line2) : null;
  const city = String(body.city || "").trim();
  const state = body.state ? String(body.state) : null;
  const pincode = body.pincode ? String(body.pincode) : null;
  const latitude = body.latitude != null ? Number(body.latitude) : 8.7139;
  const longitude = body.longitude != null ? Number(body.longitude) : 77.7567;
  const isDefault = Boolean(body.isDefault);

  if (!line1) return err("Address line1 required", 400, "BAD_LINE1");
  if (!city) return err("City required", 400, "BAD_CITY");
  if (isNaN(latitude) || isNaN(longitude))
    return err("Invalid coordinates", 400, "BAD_COORDS");

  const created = await db.$transaction(async (tx) => {
    if (isDefault) {
      await tx.address.updateMany({
        where: { userId: user!.id, isDefault: true },
        data: { isDefault: false },
      });
    }
    return tx.address.create({
      data: {
        userId: user!.id,
        label,
        line1,
        line2,
        city,
        state,
        pincode,
        latitude,
        longitude,
        isDefault,
      },
    });
  });

  return ok({ address: created }, 201);
}
