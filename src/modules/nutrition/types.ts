import type { EntrySource, MealType, QuantityUnit } from "@/lib/db/schema/enums";
import type { Macros } from "./domain/macros";

export interface MealItemView {
  id: string;
  foodId: string | null;
  name: string;
  quantity: number;
  unit: QuantityUnit;
  grams: number;
  /** 0..1 for AI-estimated items, otherwise null. */
  aiConfidence: number | null;
  macros: Macros;
}

export interface MealView {
  id: string;
  mealType: MealType;
  name: string | null;
  eatenAt: string;
  /** Local time of day, e.g. "13:05", formatted in the user's timezone. */
  timeLabel: string;
  source: EntrySource;
  /** Authenticated URL of the meal photo, when it was logged from a photo. */
  photoUrl: string | null;
  items: MealItemView[];
  totals: Macros;
}

/** A template item with everything the client needs to preview macros while editing quantities. */
export interface TemplateItemView {
  id: string;
  foodId: string;
  foodName: string;
  quantity: number;
  unit: QuantityUnit;
  optionGroup: string | null;
  isDefaultOption: boolean;
}

export interface TemplateView {
  id: string;
  name: string;
  mealType: MealType;
  items: TemplateItemView[];
}

export interface NutritionTargets {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

export interface DailyNutrition {
  date: string;
  previousDate: string;
  nextDate: string;
  isToday: boolean;
  totals: Macros;
  targets: NutritionTargets;
  meals: MealView[];
}
