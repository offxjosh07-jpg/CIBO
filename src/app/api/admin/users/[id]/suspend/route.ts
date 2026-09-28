import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole, ok, err } from "@/lib/api";
import { toPublicUser } from "@/app/api/_lib/helpers";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/admin/users/:id/suspend { suspended } -> { user }
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

  const suspended = Boolean(body.suspended);
  const target = await db.user.findUnique({ where: { id } });
  if (!target) return err("User not found", 404, "NOT_FOUND");
  if (target.role === "ADMIN") {
    return err("Cannot suspend admin users", 400, "BAD_TARGET");
  }

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id },
      data: { isActive: !suspended },
    });
    await tx.adminAction.create({
      data: {
        adminId: admin!.id,
        targetType: "USER",
        targetId: id,
        action: suspended ? "SUSPEND" : "REINSTATE",
        reason: body.reason ? String(body.reason) : null,
      },
    });
    // Notify user
    await tx.notification.create({
      data: {
        userId: id,
        type: "VERIFICATION",
        title: suspended ? "Account suspended" : "Account reinstated",
        body: suspended
          ? "Your account has been suspended by the CIBO team. Contact support for help."
          : "Your account has been reinstated. Welcome back!",
        data: JSON.stringify({ suspended }),
      },
    });
    // If suspending, kill sessions
    if (suspended) {
      await tx.session.deleteMany({ where: { userId: id } });
    }
  });

  const updated = await db.user.findUnique({ where: { id } });
  return ok({ user: toPublicUser(updated!) });
}
