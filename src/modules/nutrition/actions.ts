"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/lib/actions";
import { requireUserOrThrow } from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/rate-limit";
import { deleteMeal, logMeal, saveTargets } from "./service";
import { analyzeFoodPhoto, saveAiMeal, type PhotoAnalysis } from "./photo-service";
import type { NutritionTargets } from "./types";
import { logMealSchema, mealIdSchema, saveAiMealSchema, targetsSchema } from "./validators";
import { AppError } from "@/lib/errors";

const LIMIT = { limit: 120, windowMs: 60_000 } as const;

function refreshNutritionViews(): void {
  revalidatePath("/nutrition");
  revalidatePath("/");
}

export async function logMealAction(input: unknown): Promise<ActionResult<{ mealId: string }>> {
  return runAction(async () => {
    const user = await requireUserOrThrow();
    await enforceRateLimit(`nutrition:write:${user.id}`, LIMIT);
    const result = await logMeal(user.id, logMealSchema.parse(input));
    refreshNutritionViews();
    return result;
  });
}

export async function deleteMealAction(input: unknown): Promise<ActionResult<{ mealId: string }>> {
  return runAction(async () => {
    const user = await requireUserOrThrow();
    await enforceRateLimit(`nutrition:write:${user.id}`, LIMIT);
    const { mealId } = mealIdSchema.parse(input);
    await deleteMeal(user.id, mealId);
    refreshNutritionViews();
    return { mealId };
  });
}

export async function saveTargetsAction(input: unknown): Promise<ActionResult<NutritionTargets>> {
  return runAction(async () => {
    const user = await requireUserOrThrow();
    await enforceRateLimit(`nutrition:write:${user.id}`, LIMIT);
    const result = await saveTargets(user.id, targetsSchema.parse(input));
    refreshNutritionViews();
    return result;
  });
}

const PHOTO_PER_MINUTE = { limit: 8, windowMs: 60_000 } as const;
const PHOTO_PER_DAY = { limit: 60, windowMs: 24 * 60 * 60_000 } as const;

/** Receives the photo (already downsized in the browser), asks Claude for an estimate and returns it for review. Saves nothing as a meal. */
export async function analyzeFoodPhotoAction(formData: FormData): Promise<ActionResult<PhotoAnalysis>> {
  return runAction(async () => {
    const user = await requireUserOrThrow();
    // Every analysis costs money: keep both a burst limit and a daily cap.
    await enforceRateLimit(`nutrition:photo:min:${user.id}`, PHOTO_PER_MINUTE);
    await enforceRateLimit(`nutrition:photo:day:${user.id}`, PHOTO_PER_DAY);

    const photo = formData.get("photo");
    if (!(photo instanceof File)) throw new AppError("validation", "No photo received. Try again.");
    const hint = formData.get("hint");
    return analyzeFoodPhoto(user.id, {
      bytes: new Uint8Array(await photo.arrayBuffer()),
      hint: typeof hint === "string" ? hint : undefined,
    });
  });
}

export async function saveAiMealAction(input: unknown): Promise<ActionResult<{ mealId: string }>> {
  return runAction(async () => {
    const user = await requireUserOrThrow();
    await enforceRateLimit(`nutrition:write:${user.id}`, LIMIT);
    const result = await saveAiMeal(user.id, saveAiMealSchema.parse(input));
    refreshNutritionViews();
    return result;
  });
}
