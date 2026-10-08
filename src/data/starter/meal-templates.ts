import type { MealType, QuantityUnit } from "@/lib/db/schema/enums";

export interface StarterTemplateItem {
  foodSlug: string;
  quantity: number;
  unit: QuantityUnit;
  /** Alternatives share an option group; exactly one is chosen when logging. */
  optionGroup?: string;
  isDefaultOption?: boolean;
}

export interface StarterMealTemplate {
  name: string;
  mealType: MealType;
  items: readonly StarterTemplateItem[];
}

const g = (foodSlug: string, quantity: number): StarterTemplateItem => ({ foodSlug, quantity, unit: "g" });
const piece = (foodSlug: string, quantity: number): StarterTemplateItem => ({ foodSlug, quantity, unit: "piece" });

export const STARTER_MEAL_TEMPLATES: readonly StarterMealTemplate[] = [
  {
    name: "Breakfast",
    mealType: "breakfast",
    items: [piece("egg-whole", 3), g("rice-cooked", 180), g("yogurt-plain", 150)],
  },
  {
    name: "Lunch",
    mealType: "lunch",
    items: [g("lean-meat-cooked", 200), g("rice-cooked", 200)],
  },
  {
    name: "Pre workout",
    mealType: "pre_workout",
    // "Protein shake" is modelled as one scoop of protein powder. Edit to match your shake.
    items: [g("greek-yogurt-low-fat", 150), piece("protein-powder", 1)],
  },
  {
    name: "Post workout",
    mealType: "post_workout",
    items: [piece("egg-whole", 3), g("lean-meat-cooked", 200), g("rice-cooked", 180)],
  },
  {
    name: "Before bed",
    mealType: "before_bed",
    items: [piece("protein-powder", 1), g("greek-yogurt-low-fat", 150)],
  },
  {
    name: "High calorie protein shake",
    mealType: "snack",
    items: [
      piece("protein-powder", 1),
      g("oats-dry", 55),
      piece("banana", 1),
      g("blueberries", 90),
      g("peanut-butter", 22),
      { foodSlug: "water", quantity: 300, unit: "ml", optionGroup: "liquid", isDefaultOption: true },
      { foodSlug: "milk-semi-skimmed", quantity: 300, unit: "ml", optionGroup: "liquid", isDefaultOption: false },
    ],
  },
];
