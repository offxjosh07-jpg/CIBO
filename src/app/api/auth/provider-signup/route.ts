import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, isEmail, isPhone, strongPassword, rateLimit, setSessionCookie } from "@/lib/api";
import { hashPassword, createSession } from "@/lib/auth";
import { toPublicUser, getClientIp } from "@/app/api/_lib/helpers";

export const runtime = "nodejs";

const BUSINESS_TYPES = new Set([
  "WEDDING_CATERER",
  "RESTAURANT",
  "BAKERY",
  "HOTEL",
  "CLOUD_KITCHEN",
  "CANTEEN",
  "EVENT_ORGANIZER",
  "OTHER",
]);

// POST /api/auth/provider-signup (data) -> { user, providerId }
// Full provider onboarding with business profile + documents metadata.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(`provider-signup:${ip}`, 8, 60_000)) {
    return err("Too many signups. Try again later.", 429, "RATE_LIMITED");
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON body", 400, "BAD_BODY");
  }

  const name = String(body.ownerName || body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const phone = body.phone ? String(body.phone).trim() : "";
  const businessName = String(body.businessName || "").trim();
  const businessType = String(body.businessType || "OTHER").toUpperCase();
  const ownerName = String(body.ownerName || name || "").trim();
  const addressLine = String(body.addressLine || "").trim();
  const city = String(body.city || "").trim();
  const state = String(body.state || "").trim();
  const pincode = String(body.pincode || "").trim();
  const latitude = body.latitude != null ? Number(body.latitude) : 8.7139;
  const longitude = body.longitude != null ? Number(body.longitude) : 77.7567;
  const licenseNumber = body.licenseNumber ? String(body.licenseNumber).trim() : null;
  const licenseType = body.licenseType ? String(body.licenseType).trim() : null;
  const bankName = body.bankName ? String(body.bankName).trim() : null;
  const bankAccount = body.bankAccount ? String(body.bankAccount).trim() : null;
  const bankIfsc = body.bankIfsc ? String(body.bankIfsc).trim() : null;
  const upiId = body.upiId ? String(body.upiId).trim() : null;
  const fulfillment = String(body.fulfillment || "PICKUP_ONLY").toUpperCase();
  const deliveryFee = body.deliveryFee != null ? Number(body.deliveryFee) : 0;
  const bio = body.bio ? String(body.bio) : null;
  const logoUrl = body.logoUrl ? String(body.logoUrl) : null;
  const coverUrl = body.coverUrl ? String(body.coverUrl) : null;
  const documents = Array.isArray(body.documents) ? body.documents : [];

  if (!ownerName || ownerName.length < 2) return err("Owner name required", 400, "BAD_NAME");
  if (!isEmail(email)) return err("Valid email required", 400, "BAD_EMAIL");
  if (!strongPassword(password)) return err("Password too short", 400, "WEAK_PASSWORD");
  if (!phone || !isPhone(phone)) return err("Valid phone required", 400, "BAD_PHONE");
  if (!businessName) return err("Business name required", 400, "BAD_BUSINESS_NAME");
  if (!BUSINESS_TYPES.has(businessType)) return err("Invalid business type", 400, "BAD_BUSINESS_TYPE");
  if (!addressLine) return err("Address required", 400, "BAD_ADDRESS");
  if (!city) return err("City required", 400, "BAD_CITY");
  if (!state) return err("State required", 400, "BAD_STATE");
  if (!/^\d{6}$/.test(pincode)) return err("Valid 6-digit pincode required", 400, "BAD_PINCODE");

  const emailTaken = await db.user.findUnique({ where: { email } });
  if (emailTaken) return err("Email already registered", 409, "EMAIL_EXISTS");
  if (phone) {
    const phoneTaken = await db.user.findUnique({ where: { phone } });
    if (phoneTaken) return err("Phone already registered", 409, "PHONE_EXISTS");
  }

  const passwordHash = hashPassword(password);

  const result = await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: ownerName,
        email,
        phone,
        passwordHash,
        role: "PROVIDER",
      },
    });

    const provider = await tx.providerProfile.create({
      data: {
        userId: user.id,
        businessName,
        ownerName,
        businessType,
        phone,
        email,
        addressLine,
        city,
        state,
        pincode,
        latitude,
        longitude,
        verificationStatus: "PENDING",
        licenseNumber,
        licenseType,
        bankName,
        bankAccount,
        bankIfsc,
        upiId,
        fulfillment: fulfillment === "PICKUP_AND_DELIVERY" ? "PICKUP_AND_DELIVERY" : "PICKUP_ONLY",
        deliveryFee,
        bio,
        logoUrl,
        coverUrl,
      },
    });

    // Documents — store metadata only (URLs are assumed pre-uploaded by client).
    for (const d of documents) {
      if (!d || typeof d !== "object") continue;
      const type = String(d.type || "").toUpperCase();
      const url = String(d.url || "").trim();
      if (!type || !url) continue;
      await tx.providerDocument.create({
        data: {
          providerId: provider.id,
          type,
          url,
          status: "PENDING",
        },
      });
    }

    return { user, provider };
  });

  const token = await createSession(result.user.id);
  await setSessionCookie(token);

  return ok(
    {
      user: toPublicUser(result.user),
      providerId: result.provider.id,
    },
    201
  );
}
