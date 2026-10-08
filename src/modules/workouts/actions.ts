"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/lib/actions";
import { requireUserOrThrow } from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  abandonWorkout,
  addExtraSet,
  finishWorkout,
  removeExtraSet,
  savePlanDay,
  saveSet,
  startWorkout,
  type FinishResult,
} from "./service";
import type { SetView } from "./types";
import {
  exerciseSessionIdSchema,
  savePlanDaySchema,
  saveSetSchema,
  sessionIdSchema,
  setIdSchema,
  startWorkoutSchema,
} from "./validators";

/**
 * Server actions are the only entry points the UI uses. Each one authenticates, validates,
 * rate-limits and then delegates to the service layer. No business logic lives here.
 * Client-supplied data is never trusted: input is parsed with Zod and ownership is checked in queries.
 */

const MUTATION_LIMIT = { limit: 240, windowMs: 60_000 } as const;
const LIFECYCLE_LIMIT = { limit: 30, windowMs: 60_000 } as const;

function refreshWorkoutViews(): void {
  revalidatePath("/");
  revalidatePath("/workout");
  revalidatePath("/progress");
}

export async function startWorkoutAction(
  input: unknown,
): Promise<ActionResult<{ sessionId: string; resumed: boolean }>> {
  return runAction(async () => {
    const user = await requireUserOrThrow();
    await enforceRateLimit(`workout:lifecycle:${user.id}`, LIFECYCLE_LIMIT);
    const { dayId } = startWorkoutSchema.parse(input);
    const result = await startWorkout(user.id, dayId);
    refreshWorkoutViews();
    return result;
  });
}

export async function saveSetAction(input: unknown): Promise<ActionResult<SetView>> {
  return runAction(async () => {
    const user = await requireUserOrThrow();
    await enforceRateLimit(`workout:mutate:${user.id}`, MUTATION_LIMIT);
    return saveSet(user.id, saveSetSchema.parse(input));
  });
}

export async function addSetAction(input: unknown): Promise<ActionResult<SetView>> {
  return runAction(async () => {
    const user = await requireUserOrThrow();
    await enforceRateLimit(`workout:mutate:${user.id}`, MUTATION_LIMIT);
    const { exerciseSessionId } = exerciseSessionIdSchema.parse(input);
    return addExtraSet(user.id, exerciseSessionId);
  });
}

export async function removeSetAction(input: unknown): Promise<ActionResult<{ setId: string }>> {
  return runAction(async () => {
    const user = await requireUserOrThrow();
    await enforceRateLimit(`workout:mutate:${user.id}`, MUTATION_LIMIT);
    const { setId } = setIdSchema.parse(input);
    await removeExtraSet(user.id, setId);
    return { setId };
  });
}

export async function finishWorkoutAction(input: unknown): Promise<ActionResult<FinishResult>> {
  return runAction(async () => {
    const user = await requireUserOrThrow();
    await enforceRateLimit(`workout:lifecycle:${user.id}`, LIFECYCLE_LIMIT);
    const { sessionId } = sessionIdSchema.parse(input);
    const result = await finishWorkout(user.id, sessionId);
    refreshWorkoutViews();
    return result;
  });
}

export async function abandonWorkoutAction(input: unknown): Promise<ActionResult<{ sessionId: string }>> {
  return runAction(async () => {
    const user = await requireUserOrThrow();
    await enforceRateLimit(`workout:lifecycle:${user.id}`, LIFECYCLE_LIMIT);
    const { sessionId } = sessionIdSchema.parse(input);
    await abandonWorkout(user.id, sessionId);
    refreshWorkoutViews();
    return { sessionId };
  });
}

export async function savePlanDayAction(input: unknown): Promise<ActionResult<{ count: number }>> {
  return runAction(async () => {
    const user = await requireUserOrThrow();
    await enforceRateLimit(`workout:plan:${user.id}`, LIFECYCLE_LIMIT);
    const result = await savePlanDay(user.id, savePlanDaySchema.parse(input));
    refreshWorkoutViews();
    return result;
  });
}
