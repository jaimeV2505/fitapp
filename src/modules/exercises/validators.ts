import { z } from "zod";
import { EQUIPMENT, MOVEMENT_TYPES, MUSCLE_GROUPS } from "@/lib/db/schema/enums";

export const createExerciseSchema = z.object({
  name: z.string().trim().min(2, "Give the exercise a name").max(80),
  primaryMuscle: z.enum(MUSCLE_GROUPS),
  equipment: z.enum(EQUIPMENT).nullable().optional(),
  movementType: z.enum(MOVEMENT_TYPES),
});

export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
