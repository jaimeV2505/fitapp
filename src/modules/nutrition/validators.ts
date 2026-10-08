import { z } from "zod";
import { MEAL_TYPES, QUANTITY_UNITS } from "@/lib/db/schema/enums";

export const logMealSchema = z.object({
  mealType: z.enum(MEAL_TYPES),
  name: z.string().trim().max(80).nullable().optional(),
  templateId: z.uuid().nullable().optional(),
  /** YYYY-MM-DD in the user's timezone. Defaults to today. */
  localDate: z.iso.date().optional(),
  // Only food id, quantity and unit come from the client. Nutrition is always computed on the server.
  items: z
    .array(
      z.object({
        foodId: z.uuid(),
        quantity: z.number().positive().max(10000),
        unit: z.enum(QUANTITY_UNITS),
      }),
    )
    .min(1, "Add at least one food")
    .max(40),
});

export const mealIdSchema = z.object({ mealId: z.uuid() });

const target = (max: number) => z.number().int().min(0).max(max).nullable();
export const targetsSchema = z.object({
  calories: target(20000),
  protein: target(1500),
  carbs: target(2500),
  fat: target(1000),
});

export const dateSchema = z.object({ date: z.iso.date() });

export type LogMealInput = z.infer<typeof logMealSchema>;
export type TargetsInput = z.infer<typeof targetsSchema>;

export const saveAiMealSchema = z.object({
  analysisId: z.uuid(),
  mealType: z.enum(MEAL_TYPES),
  name: z.string().trim().max(80).nullable().optional(),
  localDate: z.iso.date().optional(),
  // The user's reviewed numbers. They may differ from what the model said, so they are bounded here.
  items: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        grams: z.number().positive().max(5000),
        calories: z.number().min(0).max(5000),
        protein: z.number().min(0).max(500),
        carbs: z.number().min(0).max(1000),
        fat: z.number().min(0).max(500),
        confidence: z.number().min(0).max(1).nullable().optional(),
      }),
    )
    .min(1, "Keep at least one food")
    .max(20),
});

export type SaveAiMealInput = z.infer<typeof saveAiMealSchema>;
