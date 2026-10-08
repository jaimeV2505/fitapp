import type { MealType, QuantityUnit } from "@/lib/db/schema/enums";

export interface RecentSourceItem {
  foodId: string | null;
  quantity: number;
  unit: QuantityUnit;
}

export interface RecentSource {
  id: string;
  mealType: MealType;
  name: string | null;
  /** ISO timestamp the meal was eaten. */
  eatenAt: string;
  items: readonly RecentSourceItem[];
}

export interface RecentMealItem {
  foodId: string;
  quantity: number;
  unit: QuantityUnit;
}

export interface RecentMeal {
  /** The most recent meal with this exact content. */
  sourceId: string;
  mealType: MealType;
  name: string | null;
  items: RecentMealItem[];
  lastEatenAt: string;
  /** How many times this exact meal appears in the period. */
  times: number;
}

const signature = (meal: RecentSource): string =>
  `${meal.mealType}|${meal.items.map((item) => `${item.foodId}:${item.unit}:${item.quantity}`).sort().join(",")}`;

/**
 * The meals worth offering as "repeat this": the same meal eaten several times appears once (the most recent one,
 * counting how often), most recent first. A meal is left out when it has no items or when any item has no usable
 * food any more (an AI-estimated item, a deleted food), because repeating half a meal would be misleading.
 */
export function buildRecentMeals(meals: readonly RecentSource[], usableFoodIds: ReadonlySet<string>, limit = 6): RecentMeal[] {
  const bySignature = new Map<string, RecentMeal>();
  const newestFirst = [...meals].sort((a, b) => b.eatenAt.localeCompare(a.eatenAt));

  for (const meal of newestFirst) {
    if (meal.items.length === 0) continue;
    const usable: RecentMealItem[] = [];
    for (const item of meal.items) {
      if (item.foodId === null || !usableFoodIds.has(item.foodId) || item.quantity <= 0) break;
      usable.push({ foodId: item.foodId, quantity: item.quantity, unit: item.unit });
    }
    if (usable.length !== meal.items.length) continue;

    const key = signature(meal);
    const existing = bySignature.get(key);
    if (existing) existing.times += 1;
    else bySignature.set(key, { sourceId: meal.id, mealType: meal.mealType, name: meal.name, items: usable, lastEatenAt: meal.eatenAt, times: 1 });
  }
  return [...bySignature.values()].slice(0, limit);
}
