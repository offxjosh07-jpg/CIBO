import { db } from "@/lib/db";
import { ok } from "@/lib/api";

export const runtime = "nodejs";

// GET /api/categories -> { categories: FoodCategory[] }
export async function GET() {
  const categories = await db.foodCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return ok({ categories });
}
