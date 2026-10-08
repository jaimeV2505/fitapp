"use server";

import { z } from "zod";
import { runAction, type ActionResult } from "@/lib/actions";
import { requireUserOrThrow } from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/rate-limit";
import { MUSCLE_GROUPS } from "@/lib/db/schema/enums";
import { browseExercises, createCustomExercise, getExerciseDetail } from "./service";
import { createExerciseSchema } from "./validators";
import type { ExerciseDetail, ExerciseListItem } from "./types";

const exerciseIdSchema = z.object({ exerciseId: z.uuid() });

export async function getExerciseDetailAction(input: unknown): Promise<ActionResult<ExerciseDetail>> {
  return runAction(async () => {
    const user = await requireUserOrThrow();
    await enforceRateLimit(`exercise:detail:${user.id}`, { limit: 120, windowMs: 60_000 });
    const { exerciseId } = exerciseIdSchema.parse(input);
    return getExerciseDetail(user.id, exerciseId);
  });
}

const searchSchema = z.object({
  query: z.string().trim().max(60).optional(),
  muscle: z.enum(MUSCLE_GROUPS).optional(),
});

/** Exercise picker search (plan editor). */
export async function searchExercisesAction(input: unknown): Promise<ActionResult<ExerciseListItem[]>> {
  return runAction(async () => {
    const user = await requireUserOrThrow();
    await enforceRateLimit(`exercise:search:${user.id}`, { limit: 240, windowMs: 60_000 });
    const { query, muscle } = searchSchema.parse(input);
    return browseExercises(user.id, { query: query || undefined, muscle });
  });
}

export async function createExerciseAction(input: unknown): Promise<ActionResult<ExerciseListItem>> {
  return runAction(async () => {
    const user = await requireUserOrThrow();
    await enforceRateLimit(`exercise:create:${user.id}`, { limit: 30, windowMs: 60_000 });
    return createCustomExercise(user.id, createExerciseSchema.parse(input));
  });
}
