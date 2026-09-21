import { db } from "@/lib/db";
import { requireRole, ok, err } from "@/lib/api";

export const runtime = "nodejs";

// GET /api/provider/me -> { provider, documents }
export async function GET() {
  const { user, response } = await requireRole("PROVIDER");
  if (response) return response;

  const provider = await db.providerProfile.findUnique({
    where: { userId: user!.id },
    include: { documents: true },
  });
  if (!provider) return err("Provider profile not found", 404, "NO_PROVIDER");

  const { documents, ...rest } = provider;
  return ok({ provider: rest, documents });
}

// PATCH /api/provider/me (data) -> { provider }
export async function PATCH(req: Request) {
  const { user, response } = await requireRole("PROVIDER");
  if (response) return response;

  const provider = await db.providerProfile.findUnique({
    where: { userId: user!.id },
  });
  if (!provider) return err("Provider profile not found", 404, "NO_PROVIDER");

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON body", 400, "BAD_BODY");
  }

  const data: any = {};
  const allowed = [
    "businessName",
    "ownerName",
    "businessType",
    "phone",
    "email",
    "addressLine",
    "city",
    "state",
    "pincode",
    "latitude",
    "longitude",
    "licenseNumber",
    "licenseType",
    "bankName",
    "bankAccount",
    "bankIfsc",
    "upiId",
    "fulfillment",
    "deliveryFee",
    "bio",
    "logoUrl",
    "coverUrl",
  ];
  for (const k of allowed) {
    if (body[k] !== undefined) {
      if (k === "latitude" || k === "longitude" || k === "deliveryFee") {
        const v = Number(body[k]);
        if (isNaN(v)) return err(`Invalid ${k}`, 400, "BAD_FIELD");
        data[k] = v;
      } else {
        data[k] = body[k] === null ? null : String(body[k]);
      }
    }
  }

  const updated = await db.providerProfile.update({
    where: { id: provider.id },
    data,
  });

  return ok({ provider: updated });
}
