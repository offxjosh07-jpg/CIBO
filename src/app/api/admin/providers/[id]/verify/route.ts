import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole, ok, err } from "@/lib/api";

export const runtime = "nodejs";

const ALLOWED_STATUSES = new Set([
  "PENDING",
  "UNDER_REVIEW",
  "VERIFIED",
  "REJECTED",
  "SUSPENDED",
]);

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/admin/providers/:id/verify { status } -> { provider }
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const { user: admin, response } = await requireRole("ADMIN", "SUPPORT");
  if (response) return response;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON body", 400, "BAD_BODY");
  }

  const status = String(body.status || "").toUpperCase();
  if (!ALLOWED_STATUSES.has(status)) {
    return err("Invalid verification status", 400, "BAD_STATUS");
  }

  const provider = await db.providerProfile.findUnique({ where: { id } });
  if (!provider) return err("Provider not found", 404, "NOT_FOUND");

  await db.$transaction(async (tx) => {
    await tx.providerProfile.update({
      where: { id },
      data: { verificationStatus: status },
    });
    await tx.adminAction.create({
      data: {
        adminId: admin!.id,
        targetType: "PROVIDER",
        targetId: id,
        action: status === "VERIFIED" ? "VERIFY" : status === "REJECTED" ? "REJECT" : "VERIFY",
        reason: body.reason ? String(body.reason) : null,
      },
    });
    await tx.notification.create({
      data: {
        userId: provider.userId,
        type: "VERIFICATION",
        title: "Provider verification update",
        body:
          status === "VERIFIED"
            ? "Congratulations! Your provider account is now verified."
            : status === "REJECTED"
            ? "Your provider verification was rejected. Please review your documents."
            : status === "SUSPENDED"
            ? "Your provider account has been suspended. Contact support."
            : `Your verification status is now ${status}.`,
        data: JSON.stringify({ status }),
      },
    });
  });

  const updated = await db.providerProfile.findUnique({ where: { id } });
  return ok({ provider: updated });
}
