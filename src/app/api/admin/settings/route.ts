import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole, ok, err } from "@/lib/api";

export const runtime = "nodejs";

// GET /api/admin/settings -> { settings: Record<string,string> }
export async function GET() {
  const { response } = await requireRole("ADMIN", "SUPPORT");
  if (response) return response;

  const rows = await db.platformSetting.findMany();
  const settings: Record<string, string> = {};
  for (const r of rows) settings[r.key] = r.value;
  return ok({ settings });
}

// POST /api/admin/settings { key, value } -> { ok: true }
export async function POST(req: NextRequest) {
  const { response } = await requireRole("ADMIN", "SUPPORT");
  if (response) return response;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON body", 400, "BAD_BODY");
  }

  const key = String(body.key || "").trim();
  const value = body.value != null ? String(body.value) : "";
  if (!key) return err("key required", 400, "BAD_KEY");
  if (value === "") return err("value required", 400, "BAD_VALUE");

  await db.platformSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });

  return ok({ ok: true });
}
