import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser, ok, err } from "@/lib/api";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

// DELETE /api/addresses/:id -> { ok: true }
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const { user, response } = await requireUser();
  if (response) return response;

  const existing = await db.address.findUnique({ where: { id } });
  if (!existing || existing.userId !== user!.id) {
    return err("Address not found", 404, "NOT_FOUND");
  }

  await db.address.delete({ where: { id } });
  return ok({ ok: true });
}
