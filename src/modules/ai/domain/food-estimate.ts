import { z } from "zod";
import type { ConfidenceLevel } from "@/lib/db/schema/enums";
import { sumMacros, type Macros } from "@/modules/nutrition/domain/macros";

/**
 * What the model is asked to return. Never trusted as-is: it is parsed here, numbers are bounded,
 * totals are recomputed from the items and suspicious items get lower confidence.
 */
export const aiFoodItemSchema = z.object({
  name: z.string().trim().min(1).max(80),
  estimatedGrams: z.number().positive().max(5000),
  calories: z.number().min(0).max(5000),
  protein: z.number().min(0).max(500),
  carbs: z.number().min(0).max(1000),
  fat: z.number().min(0).max(500),
  confidence: z.number().min(0).max(1),
});

export const aiFoodResponseSchema = z.object({
  foods: z.array(aiFoodItemSchema).min(1).max(20),
  confidence: z.enum(["high", "medium", "low"]).optional(),
  notes: z.string().trim().max(400).optional(),
});

export interface EstimatedItem {
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  /** 0..1 */
  confidence: number;
}

export interface FoodEstimate {
  items: EstimatedItem[];
  totals: Macros;
  confidence: ConfidenceLevel;
  notes: string | null;
}

const round1 = (value: number): number => Math.round(value * 10) / 10;

export function levelFromScore(score: number): ConfidenceLevel {
  if (score >= 0.75) return "high";
  if (score >= 0.5) return "medium";
  return "low";
}

const ORDER: Record<ConfidenceLevel, number> = { low: 0, medium: 1, high: 2 };
const lower = (a: ConfidenceLevel, b: ConfidenceLevel): ConfidenceLevel => (ORDER[a] <= ORDER[b] ? a : b);

/** Energy implied by the macros (4/4/9 kcal per gram). */
export function macroEnergy(item: Pick<EstimatedItem, "protein" | "carbs" | "fat">): number {
  return item.protein * 4 + item.carbs * 4 + item.fat * 9;
}

/** Items whose calories disagree with their own macros by more than 40% cannot all be right: cap their confidence. */
const INCONSISTENT_CAP = 0.4;

export function normalizeEstimate(raw: unknown): FoodEstimate {
  const parsed = aiFoodResponseSchema.parse(raw);

  const items = parsed.foods.map((food): EstimatedItem => {
    const implied = macroEnergy(food);
    const inconsistent = food.calories > 20 && Math.abs(food.calories - implied) / food.calories > 0.4;
    return {
      name: food.name,
      grams: round1(food.estimatedGrams),
      calories: round1(food.calories),
      protein: round1(food.protein),
      carbs: round1(food.carbs),
      fat: round1(food.fat),
      confidence: inconsistent ? Math.min(food.confidence, INCONSISTENT_CAP) : food.confidence,
    };
  });

  const average = items.reduce((sum, item) => sum + item.confidence, 0) / items.length;
  const derived = levelFromScore(average);
  return {
    items,
    totals: sumMacros(items),
    // Take the more cautious of the model's own overall rating and ours.
    confidence: parsed.confidence ? lower(parsed.confidence, derived) : derived,
    notes: parsed.notes && parsed.notes !== "" ? parsed.notes : null,
  };
}

/** Rescales an item to a new weight, keeping its nutrition density. */
export function scaleItemToGrams(item: EstimatedItem, grams: number): EstimatedItem {
  if (item.grams <= 0) return { ...item, grams };
  const factor = grams / item.grams;
  return {
    ...item,
    grams: round1(grams),
    calories: round1(item.calories * factor),
    protein: round1(item.protein * factor),
    carbs: round1(item.carbs * factor),
    fat: round1(item.fat * factor),
  };
}
