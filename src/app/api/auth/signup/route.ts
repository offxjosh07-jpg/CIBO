import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, isEmail, isPhone, strongPassword, rateLimit, setSessionCookie } from "@/lib/api";
import { hashPassword, createSession } from "@/lib/auth";
import { toPublicUser, getClientIp } from "@/app/api/_lib/helpers";

export const runtime = "nodejs";

const ALLOWED_ROLES = new Set(["CUSTOMER", "PROVIDER"]);

// POST /api/auth/signup { name, email, password, phone?, role } -> { user }
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(`signup:${ip}`, 10, 60_000)) {
    return err("Too many signups. Try again later.", 429, "RATE_LIMITED");
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON body", 400, "BAD_BODY");
  }

  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const phone = body.phone ? String(body.phone).trim() : null;
  const role = String(body.role || "CUSTOMER").toUpperCase();

  if (!name || name.length < 2) return err("Name is required", 400, "BAD_NAME");
  if (!isEmail(email)) return err("Valid email is required", 400, "BAD_EMAIL");
  if (!strongPassword(password))
    return err("Password must be at least 6 characters", 400, "WEAK_PASSWORD");
  if (phone && !isPhone(phone)) return err("Valid phone is required", 400, "BAD_PHONE");
  if (!ALLOWED_ROLES.has(role))
    return err("Role must be CUSTOMER or PROVIDER", 400, "BAD_ROLE");

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return err("Email already registered", 409, "EMAIL_EXISTS");

  if (phone) {
    const phoneTaken = await db.user.findUnique({ where: { phone } });
    if (phoneTaken) return err("Phone already registered", 409, "PHONE_EXISTS");
  }

  const passwordHash = hashPassword(password);

  const user = await db.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
        role,
      },
    });

    if (role === "CUSTOMER") {
      await tx.customerProfile.create({
        data: { userId: created.id },
      });
    } else if (role === "PROVIDER") {
      // Bare provider signup — creates a placeholder profile pending completion.
      await tx.providerProfile.create({
        data: {
          userId: created.id,
          businessName: name,
          ownerName: name,
          businessType: "OTHER",
          phone: phone || "",
          email,
          addressLine: "",
          city: "",
          state: "",
          pincode: "",
          verificationStatus: "PENDING",
        },
      });
    }

    return created;
  });

  const token = await createSession(user.id);
  await setSessionCookie(token);

  return ok({ user: toPublicUser(user) }, 201);
}
