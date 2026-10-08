import { z } from "zod";

const per100 = (max: number) => z.number().min(0).max(max);

export const saveFoodSchema = z
  .object({
    id: z.uuid().optional(),
    name: z.string().trim().min(1, "Give the food a name").max(80),
    brand: z.string().trim().max(60).nullable().optional(),
    caloriesPer100: per100(1000),
    proteinPer100: per100(100),
    carbsPer100: per100(100),
    fatPer100: per100(100),
    pieceLabel: z.string().trim().max(24).nullable().optional(),
    pieceGrams: z.number().positive().max(2000).nullable().optional(),
  })
  .refine((food) => food.proteinPer100 + food.carbsPer100 + food.fatPer100 <= 100.5, {
    message: "Protein, carbs and fat per 100 g cannot add up to more than 100 g.",
    path: ["proteinPer100"],
  })
  .refine((food) => Boolean(food.pieceLabel) === (food.pieceGrams !== null && food.pieceGrams !== undefined), {
    message: "Set both the piece name and its weight, or neither.",
    path: ["pieceLabel"],
  });

export const foodIdSchema = z.object({ id: z.uuid() });

export type SaveFoodInput = z.infer<typeof saveFoodSchema>;
