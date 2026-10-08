import { and, asc, eq, ilike, inArray, isNull, notExists, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import { foods, mealTemplateItems, mealTemplates } from "@/lib/db/schema";
import type { FoodView } from "./types";

const toNumber = (value: string | null): number | null => (value === null ? null : Number(value));

function toView(row: typeof foods.$inferSelect): FoodView {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    caloriesPer100: Number(row.caloriesPer100),
    proteinPer100: Number(row.proteinPer100),
    carbsPer100: Number(row.carbsPer100),
    fatPer100: Number(row.fatPer100),
    pieceLabel: row.pieceLabel,
    pieceGrams: toNumber(row.pieceGrams),
    isBuiltIn: row.ownerId === null,
    nutritionSource: row.nutritionSource,
  };
}

/** Built-in foods the user has not overridden, plus the user's own foods. */
export async function listVisibleFoods(userId: string, query?: string): Promise<FoodView[]> {
  const override = alias(foods, "override");
  const rows = await db
    .select()
    .from(foods)
    .where(
      and(
        isNull(foods.archivedAt),
        or(
          eq(foods.ownerId, userId),
          and(
            isNull(foods.ownerId),
            notExists(db.select({ one: sql`1` }).from(override).where(and(eq(override.ownerId, userId), eq(override.slug, foods.slug)))),
          ),
        ),
        query ? ilike(foods.name, `%${query.replace(/[%_]/g, "")}%`) : undefined,
      ),
    )
    .orderBy(asc(foods.name));
  return rows.map(toView);
}

export async function findVisibleFood(userId: string, foodId: string): Promise<(FoodView & { slug: string; ownerId: string | null }) | null> {
  const [row] = await db
    .select()
    .from(foods)
    .where(and(eq(foods.id, foodId), isNull(foods.archivedAt), or(isNull(foods.ownerId), eq(foods.ownerId, userId))))
    .limit(1);
  return row ? { ...toView(row), slug: row.slug, ownerId: row.ownerId } : null;
}

export interface FoodWrite {
  name: string;
  brand: string | null;
  caloriesPer100: number;
  proteinPer100: number;
  carbsPer100: number;
  fatPer100: number;
  pieceLabel: string | null;
  pieceGrams: number | null;
}

const toColumns = (food: FoodWrite) => ({
  name: food.name,
  brand: food.brand,
  caloriesPer100: String(food.caloriesPer100),
  proteinPer100: String(food.proteinPer100),
  carbsPer100: String(food.carbsPer100),
  fatPer100: String(food.fatPer100),
  pieceLabel: food.pieceLabel,
  pieceGrams: food.pieceGrams === null ? null : String(food.pieceGrams),
  nutritionSource: "user",
});

export async function insertFood(userId: string, slug: string, food: FoodWrite): Promise<string> {
  const [row] = await db
    .insert(foods)
    .values({ ownerId: userId, slug, ...toColumns(food) })
    .returning({ id: foods.id });
  if (!row) throw new Error("Failed to create food");
  return row.id;
}

export async function updateOwnFood(userId: string, foodId: string, food: FoodWrite): Promise<boolean> {
  const rows = await db
    .update(foods)
    .set(toColumns(food))
    .where(and(eq(foods.id, foodId), eq(foods.ownerId, userId)))
    .returning({ id: foods.id });
  return rows.length > 0;
}

/**
 * Editing a built-in food must not change it for other users: create the user's own copy (same slug,
 * which hides the original for this user) and point this user's meal templates at the copy.
 */
export async function overrideBuiltInFood(userId: string, original: { id: string; slug: string }, food: FoodWrite): Promise<string> {
  return db.transaction(async (tx) => {
    const [copy] = await tx
      .insert(foods)
      .values({ ownerId: userId, slug: original.slug, ...toColumns(food) })
      .returning({ id: foods.id });
    if (!copy) throw new Error("Failed to create food copy");

    const userTemplateIds = tx.select({ id: mealTemplates.id }).from(mealTemplates).where(eq(mealTemplates.userId, userId));
    await tx
      .update(mealTemplateItems)
      .set({ foodId: copy.id })
      .where(and(eq(mealTemplateItems.foodId, original.id), inArray(mealTemplateItems.templateId, userTemplateIds)));
    return copy.id;
  });
}

export async function archiveOwnFood(userId: string, foodId: string): Promise<boolean> {
  const rows = await db
    .update(foods)
    .set({ archivedAt: new Date() })
    .where(and(eq(foods.id, foodId), eq(foods.ownerId, userId)))
    .returning({ id: foods.id });
  return rows.length > 0;
}

export async function slugExistsForOwner(userId: string, slug: string): Promise<boolean> {
  const [row] = await db
    .select({ id: foods.id })
    .from(foods)
    .where(and(eq(foods.ownerId, userId), eq(foods.slug, slug)))
    .limit(1);
  return row !== undefined;
}
