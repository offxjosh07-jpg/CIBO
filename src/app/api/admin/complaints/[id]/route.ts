import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole, ok, err } from "@/lib/api";
import { readJsonArray } from "@/app/api/_lib/helpers";

export const runtime = "nodejs";

const ALLOWED_STATUSES = new Set(["OPEN", "INVESTIGATING", "RESOLVED", "REJECTED"]);

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/admin/complaints/:id { status, resolution } -> { complaint }
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
  const resolution = body.resolution ? String(body.resolution) : null;
  if (!ALLOWED_STATUSES.has(status)) {
    return err("Invalid complaint status", 400, "BAD_STATUS");
  }
  if (status === "RESOLVED" && !resolution) {
    return err("Resolution required when marking RESOLVED", 400, "NEED_RESOLUTION");
  }

  const complaint = await db.complaint.findUnique({ where: { id } });
  if (!complaint) return err("Complaint not found", 404, "NOT_FOUND");

  await db.$transaction(async (tx) => {
    await tx.complaint.update({
      where: { id },
      data: { status, resolution },
    });
    await tx.adminAction.create({
      data: {
        adminId: admin!.id,
        targetType: "COMPLAINT",
        targetId: id,
        action: status === "RESOLVED" ? "RESOLVE" : status === "REJECTED" ? "REJECT" : "RESOLVE",
      },
    });
    await tx.notification.create({
      data: {
        userId: complaint.userId,
        type: "COMPLAINT_UPDATE",
        title: "Complaint update",
        body:
          status === "RESOLVED"
            ? `Your complaint has been resolved. ${resolution || ""}`
            : status === "REJECTED"
            ? "Your complaint was rejected. Contact support if you disagree."
            : `Your complaint status is now ${status}.`,
        data: JSON.stringify({ complaintId: id, status }),
      },
    });
  });

  const updated = await db.complaint.findUnique({ where: { id } });
  return ok({
    complaint: updated
      ? {
          ...updated,
          evidence: readJsonArray(updated.evidence),
        }
      : null,
  });
}
