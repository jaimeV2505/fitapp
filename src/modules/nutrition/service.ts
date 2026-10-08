import { AppError } from "@/lib/errors";
import { addDays, localDateString } from "@/lib/time";
import { findVisibleFood } from "@/modules/foods/repository";
import { getUserSettings } from "@/modules/settings/repository";
import { gramsFor, macrosFor, sumMacros } from "./domain/macros";
import { deleteMealRow, insertMeal, listMealsForDate, listTemplates, updateTargets, type NewMealItem } from "./repository";
import type { DailyNutrition, NutritionTargets, TemplateView } from "./types";
import type { LogMealInput, TargetsInput } from "./validators";

export async function getDailyNutrition(userId: string, requestedDate?: string, now: Date = new Date()): Promise<DailyNutrition> {
  const settings = await getUserSettings(userId);
  const today = localDateString(now, settings.timezone);
  const date = requestedDate ?? today;
  const meals = await listMealsForDate(userId, date, settings.timezone);
  return {
    date,
    previousDate: addDays(date, -1),
    nextDate: addDays(date, 1),
    isToday: date === today,
    totals: sumMacros(meals.map((meal) => meal.totals)),
    targets: {
      calories: settings.targetCalories,
      protein: settings.targetProteinG,
      carbs: settings.targetCarbsG,
      fat: settings.targetFatG,
    },
    meals,
  };
}

export async function getTemplates(userId: string): Promise<TemplateView[]> {
  return listTemplates(userId);
}

/**
 * Logs a meal. The client only says which foods and how much; calories and macros are computed here
 * from the stored food values and copied into the meal, so past meals never change when a food is edited.
 */
export async function logMeal(userId: string, input: LogMealInput, now: Date = new Date()): Promise<{ mealId: string }> {
  const settings = await getUserSettings(userId);
  const today = localDateString(now, settings.timezone);
  const localDate = input.localDate ?? today;
  if (localDate > addDays(today, 1)) throw new AppError("validation", "You cannot log meals that far in the future.");

  const items: NewMealItem[] = [];
  for (const entry of input.items) {
    const food = await findVisibleFood(userId, entry.foodId);
    if (!food) throw new AppError("not_found", "One of the foods no longer exists. Pick it again.");
    const grams = gramsFor(food, entry.quantity, entry.unit);
    if (grams === null) throw new AppError("validation", `${food.name} has no piece size. Use grams instead, or set a piece size on the food.`);
    items.push({
      foodId: food.id,
      name: food.name,
      quantity: entry.quantity,
      unit: entry.unit,
      grams,
      ...macrosFor(food, grams),
    });
  }

  const mealId = await insertMeal({
    userId,
    mealType: input.mealType,
    name: input.name?.trim() ? input.name.trim() : null,
    templateId: input.templateId ?? null,
    // A meal logged for another day is stamped at midday of that day.
    eatenAt: localDate === today ? now : new Date(`${localDate}T12:00:00Z`),
    localDate,
    source: input.templateId ? "template" : "manual",
    items,
  });
  return { mealId };
}

export async function deleteMeal(userId: string, mealId: string): Promise<void> {
  if (!(await deleteMealRow(userId, mealId))) throw new AppError("not_found", "This meal no longer exists.");
}

/** Targets are entered by the user. The app never suggests or prescribes them. */
export async function saveTargets(userId: string, targets: TargetsInput): Promise<NutritionTargets> {
  await updateTargets(userId, targets);
  return targets;
}
