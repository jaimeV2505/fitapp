import type { MealType, QuantityUnit } from "@/lib/db/schema/enums";

export const MEAL_LABEL: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
  pre_workout: "Pre workout",
  post_workout: "Post workout",
  before_bed: "Before bed",
};

export const UNIT_LABEL: Record<QuantityUnit, string> = { g: "g", ml: "ml", piece: "pcs" };
