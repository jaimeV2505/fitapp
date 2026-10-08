import { z } from "zod";

export const startWorkoutSchema = z.object({ dayId: z.uuid() });

export const saveSetSchema = z.object({
  setId: z.uuid(),
  weightKg: z.number().min(0).max(1000).nullable(),
  reps: z.number().int().min(0).max(1000).nullable(),
  rir: z.number().int().min(0).max(10).nullable(),
  completed: z.boolean(),
  completedAt: z.iso.datetime().nullable(),
});

export const sessionIdSchema = z.object({ sessionId: z.uuid() });
export const exerciseSessionIdSchema = z.object({ exerciseSessionId: z.uuid() });
export const setIdSchema = z.object({ setId: z.uuid() });

export type StartWorkoutInput = z.infer<typeof startWorkoutSchema>;
export type SaveSetPayload = z.infer<typeof saveSetSchema>;

const int = (min: number, max: number) => z.number().int().min(min).max(max);

export const savePlanDaySchema = z.object({
  dayId: z.uuid(),
  items: z
    .array(
      z
        .object({
          exerciseId: z.uuid(),
          sets: int(1, 10),
          repMin: int(1, 100),
          repMax: int(1, 100),
          // Optional: new exercises get guidance derived from their type; existing ones keep theirs.
          rirMin: int(0, 5).nullable().optional(),
          rirMax: int(0, 5).nullable().optional(),
          allowFailureOnLastSet: z.boolean().nullable().optional(),
        })
        .refine((item) => item.repMin <= item.repMax, { message: "Minimum reps cannot exceed maximum reps.", path: ["repMin"] }),
    )
    .min(1, "A day needs at least one exercise")
    .max(20),
});

export type SavePlanDayInput = z.infer<typeof savePlanDaySchema>;
