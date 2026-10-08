import type { QuantityUnit } from "@/lib/db/schema/enums";

export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodNutrition {
  caloriesPer100: number;
  proteinPer100: number;
  carbsPer100: number;
  fatPer100: number;
  /** Grams in one natural piece ("egg", "scoop"). Null when the food has no piece size. */
  pieceGrams: number | null;
}

export const ZERO_MACROS: Macros = { calories: 0, protein: 0, carbs: 0, fat: 0 };

const round1 = (value: number): number => Math.round(value * 10) / 10;

/**
 * Converts a quantity to grams. Millilitres are treated as grams (1 g/ml), which is close enough for
 * water, milk and most drinks. Returns null when a piece is requested for a food with no piece size.
 */
export function gramsFor(food: Pick<FoodNutrition, "pieceGrams">, quantity: number, unit: QuantityUnit): number | null {
  if (unit === "piece") return food.pieceGrams === null ? null : round1(quantity * food.pieceGrams);
  return round1(quantity);
}

export function macrosFor(food: FoodNutrition, grams: number): Macros {
  const factor = grams / 100;
  return {
    calories: round1(food.caloriesPer100 * factor),
    protein: round1(food.proteinPer100 * factor),
    carbs: round1(food.carbsPer100 * factor),
    fat: round1(food.fatPer100 * factor),
  };
}

export function sumMacros(items: readonly Macros[]): Macros {
  const total = items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    ZERO_MACROS,
  );
  return { calories: round1(total.calories), protein: round1(total.protein), carbs: round1(total.carbs), fat: round1(total.fat) };
}

/** Whole-number percentage of a target. Null when there is no target to compare with. */
export function percentOf(value: number, target: number | null): number | null {
  if (target === null || target <= 0) return null;
  return Math.round((value / target) * 100);
}

export interface TemplateItemLike {
  id: string;
  optionGroup: string | null;
  isDefaultOption: boolean;
}

/**
 * Applies the user's choice for every option group (e.g. liquid: water | milk). Items without a group
 * are always kept. For a group, the chosen item wins, then the default, then the first listed.
 * `choices` maps group name -> chosen item id.
 */
export function resolveTemplateItems<T extends TemplateItemLike>(items: readonly T[], choices: Readonly<Record<string, string>>): T[] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    if (item.optionGroup === null) continue;
    groups.set(item.optionGroup, [...(groups.get(item.optionGroup) ?? []), item]);
  }
  const picked = new Map<string, string>();
  for (const [group, options] of groups) {
    const chosen = options.find((o) => o.id === choices[group]) ?? options.find((o) => o.isDefaultOption) ?? options[0];
    if (chosen) picked.set(group, chosen.id);
  }
  return items.filter((item) => item.optionGroup === null || picked.get(item.optionGroup) === item.id);
}
