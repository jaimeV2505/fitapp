import { and, asc, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { foods, mealItems, mealTemplateItems, mealTemplates, meals, userSettings } from "@/lib/db/schema";
import type { EntrySource, MealType, QuantityUnit } from "@/lib/db/schema/enums";
import { sumMacros } from "./domain/macros";
import type { MealItemView, MealView, NutritionTargets, TemplateView } from "./types";

export interface NewMealItem {
  foodId: string | null;
  name: string;
  quantity: number;
  unit: QuantityUnit;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  /** 0..1, only for AI-estimated items. */
  aiConfidence?: number | null;
}

export interface NewMeal {
  userId: string;
  mealType: MealType;
  name: string | null;
  templateId: string | null;
  eatenAt: Date;
  localDate: string;
  source: EntrySource;
  photoAnalysisId?: string | null;
  items: readonly NewMealItem[];
}

export async function insertMeal(input: NewMeal): Promise<string> {
  return db.transaction(async (tx) => {
    const [meal] = await tx
      .insert(meals)
      .values({
        userId: input.userId,
        mealType: input.mealType,
        name: input.name,
        templateId: input.templateId,
        eatenAt: input.eatenAt,
        localDate: input.localDate,
        source: input.source,
        photoAnalysisId: input.photoAnalysisId ?? null,
      })
      .returning({ id: meals.id });
    if (!meal) throw new Error("Failed to create meal");

    // Nutrition is copied into the item rows, so later food edits never change past meals.
    await tx.insert(mealItems).values(
      input.items.map((item) => ({
        mealId: meal.id,
        foodId: item.foodId,
        nameSnapshot: item.name,
        quantity: String(item.quantity),
        unit: item.unit,
        grams: String(item.grams),
        calories: String(item.calories),
        protein: String(item.protein),
        carbs: String(item.carbs),
        fat: String(item.fat),
        aiConfidence: item.aiConfidence == null ? null : String(item.aiConfidence),
      })),
    );
    return meal.id;
  });
}

export async function deleteMealRow(userId: string, mealId: string): Promise<boolean> {
  const rows = await db
    .delete(meals)
    .where(and(eq(meals.id, mealId), eq(meals.userId, userId)))
    .returning({ id: meals.id });
  return rows.length > 0;
}

export async function listMealsForDate(userId: string, localDate: string, timeZone: string): Promise<MealView[]> {
  return listMealsBetween(userId, localDate, localDate, timeZone);
}

/** Meals logged from `fromDate` to `toDate` (both inclusive, local dates), oldest first. */
export async function listMealsBetween(userId: string, fromDate: string, toDate: string, timeZone: string): Promise<MealView[]> {
  const timeFormat = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hour12: false });
  const mealRows = await db
    .select()
    .from(meals)
    .where(and(eq(meals.userId, userId), gte(meals.localDate, fromDate), lte(meals.localDate, toDate)))
    .orderBy(asc(meals.eatenAt));
  if (mealRows.length === 0) return [];

  const itemRows = await db
    .select()
    .from(mealItems)
    .where(inArray(mealItems.mealId, mealRows.map((m) => m.id)));

  return mealRows.map((meal) => {
    const items = itemRows
      .filter((item) => item.mealId === meal.id)
      .map(
        (item): MealItemView => ({
          id: item.id,
          foodId: item.foodId,
          name: item.nameSnapshot,
          quantity: Number(item.quantity),
          unit: item.unit,
          grams: Number(item.grams),
          aiConfidence: item.aiConfidence === null ? null : Number(item.aiConfidence),
          macros: {
            calories: Number(item.calories),
            protein: Number(item.protein),
            carbs: Number(item.carbs),
            fat: Number(item.fat),
          },
        }),
      );
    return {
      id: meal.id,
      mealType: meal.mealType,
      name: meal.name,
      eatenAt: meal.eatenAt.toISOString(),
      timeLabel: timeFormat.format(meal.eatenAt),
      source: meal.source,
      photoUrl: meal.photoAnalysisId ? `/api/food-photos/${meal.photoAnalysisId}` : null,
      items,
      totals: sumMacros(items.map((i) => i.macros)),
    };
  });
}

export async function listTemplates(userId: string): Promise<TemplateView[]> {
  const templates = await db
    .select()
    .from(mealTemplates)
    .where(and(eq(mealTemplates.userId, userId), isNull(mealTemplates.archivedAt)))
    .orderBy(asc(mealTemplates.position));
  return hydrateTemplates(templates);
}

async function hydrateTemplates(templates: (typeof mealTemplates.$inferSelect)[]): Promise<TemplateView[]> {
  if (templates.length === 0) return [];
  const rows = await db
    .select({
      id: mealTemplateItems.id,
      templateId: mealTemplateItems.templateId,
      foodId: mealTemplateItems.foodId,
      foodName: foods.name,
      quantity: mealTemplateItems.quantity,
      unit: mealTemplateItems.unit,
      optionGroup: mealTemplateItems.optionGroup,
      isDefaultOption: mealTemplateItems.isDefaultOption,
    })
    .from(mealTemplateItems)
    .innerJoin(foods, eq(foods.id, mealTemplateItems.foodId))
    .where(inArray(mealTemplateItems.templateId, templates.map((t) => t.id)))
    .orderBy(asc(mealTemplateItems.position));

  return templates.map((template) => ({
    id: template.id,
    name: template.name,
    mealType: template.mealType,
    items: rows
      .filter((row) => row.templateId === template.id)
      .map((row) => ({
        id: row.id,
        foodId: row.foodId,
        foodName: row.foodName,
        quantity: Number(row.quantity),
        unit: row.unit,
        optionGroup: row.optionGroup,
        isDefaultOption: row.isDefaultOption,
      })),
  }));
}

export async function updateTargets(userId: string, targets: NutritionTargets): Promise<void> {
  await db
    .update(userSettings)
    .set({
      targetCalories: targets.calories,
      targetProteinG: targets.protein,
      targetCarbsG: targets.carbs,
      targetFatG: targets.fat,
    })
    .where(eq(userSettings.userId, userId));
}

/** Average calories over the days in a range that have at least one meal logged, and how many such days there are. */
export async function averageDailyCalories(userId: string, fromDate: string, toDate: string): Promise<{ average: number | null; days: number }> {
  const daily = db
    .select({
      localDate: meals.localDate,
      total: sql<number>`sum(${mealItems.calories})::float8`.as("total"),
    })
    .from(meals)
    .innerJoin(mealItems, eq(mealItems.mealId, meals.id))
    .where(and(eq(meals.userId, userId), gte(meals.localDate, fromDate), lte(meals.localDate, toDate)))
    .groupBy(meals.localDate)
    .as("daily");

  const [row] = await db
    .select({ average: sql<number | null>`avg(${daily.total})::float8`, days: sql<number>`count(*)::int` })
    .from(daily);
  return { average: row?.average === null || row?.average === undefined ? null : Math.round(row.average), days: row?.days ?? 0 };
}
