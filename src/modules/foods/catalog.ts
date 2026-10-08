import { isNull } from "drizzle-orm";
import type { DbExecutor } from "@/lib/db";
import { foods } from "@/lib/db/schema";
import { FOOD_CATALOG } from "@/data/starter/food-catalog";

/** Inserts any built-in food that does not exist yet. Idempotent. Returns slug -> food id. */
export async function ensureBuiltInFoods(executor: DbExecutor): Promise<Map<string, string>> {
  const existing = await executor
    .select({ id: foods.id, slug: foods.slug })
    .from(foods)
    .where(isNull(foods.ownerId));

  const idBySlug = new Map(existing.map((row) => [row.slug, row.id]));
  const missing = FOOD_CATALOG.filter((entry) => !idBySlug.has(entry.slug));

  if (missing.length > 0) {
    const inserted = await executor
      .insert(foods)
      .values(
        missing.map((entry) => ({
          ownerId: null,
          slug: entry.slug,
          name: entry.name,
          caloriesPer100: String(entry.caloriesPer100),
          proteinPer100: String(entry.proteinPer100),
          carbsPer100: String(entry.carbsPer100),
          fatPer100: String(entry.fatPer100),
          pieceLabel: entry.pieceLabel ?? null,
          pieceGrams: entry.pieceGrams === undefined ? null : String(entry.pieceGrams),
          nutritionSource: "seed_estimate",
        })),
      )
      .returning({ id: foods.id, slug: foods.slug });

    for (const row of inserted) idBySlug.set(row.slug, row.id);
  }

  return idBySlug;
}
