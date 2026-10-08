import { z } from "zod";
import { AppError } from "@/lib/errors";
import { addDays, localDateString } from "@/lib/time";
import { getStorage, isStorageConfigured } from "@/lib/storage";
import { aiModelName, getAIProvider } from "@/modules/ai";
import { EXTENSION, MAX_IMAGE_BYTES, sniffImageType } from "@/modules/ai/domain/image";
import { normalizeEstimate, type FoodEstimate } from "@/modules/ai/domain/food-estimate";
import { getUserSettings } from "@/modules/settings/repository";
import { analysisAlreadySaved, findAnalysis, insertAnalysis, markAnalysisFailed, markAnalysisSucceeded } from "./photo-repository";
import { insertMeal } from "./repository";
import type { SaveAiMealInput } from "./validators";

const probeSchema = z.object({ isFood: z.boolean().optional(), foods: z.array(z.unknown()).optional() });

export interface PhotoAnalysis {
  analysisId: string;
  estimate: FoodEstimate;
}

/**
 * Photo -> storage -> Claude -> validated estimate. The estimate is only a suggestion: nothing is
 * saved as a meal until the user reviews and confirms it (saveAiMeal).
 */
export async function analyzeFoodPhoto(userId: string, input: { bytes: Uint8Array; hint?: string }): Promise<PhotoAnalysis> {
  if (input.bytes.byteLength === 0) throw new AppError("validation", "No photo received. Try again.");
  if (input.bytes.byteLength > MAX_IMAGE_BYTES) throw new AppError("validation", "That photo is too large. Try a smaller one.");
  const mimeType = sniffImageType(input.bytes);
  if (!mimeType) throw new AppError("validation", "Use a JPEG, PNG or WebP photo.");

  const provider = getAIProvider();
  if (!provider) throw new AppError("conflict", "Photo estimates need an Anthropic API key. Add ANTHROPIC_API_KEY to your .env and restart the app.");

  if (!isStorageConfigured()) throw new AppError("conflict", "Photo storage is not set up. Connect Vercel Blob to the project and redeploy.");

  const stored = await getStorage().put({
    key: `food-photos/${userId}/${crypto.randomUUID()}.${EXTENSION[mimeType]}`,
    body: input.bytes,
    contentType: mimeType,
  });
  const analysisId = await insertAnalysis({
    userId,
    storageKey: stored.key,
    mimeType,
    sizeBytes: stored.sizeBytes,
    provider: provider.name,
    model: aiModelName(),
  });

  try {
    const raw = await provider.analyzeFoodImage({ image: input.bytes, mimeType, hint: input.hint });

    const probe = probeSchema.safeParse(raw);
    if (probe.success && (probe.data.isFood === false || (probe.data.foods ?? []).length === 0)) {
      throw new AppError("validation", "I could not find food in that photo. Try a closer, well-lit shot from above.");
    }

    const estimate = normalizeEstimate(raw);
    await markAnalysisSucceeded(analysisId, estimate, estimate.confidence);
    return { analysisId, estimate };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await markAnalysisFailed(analysisId, message);
    if (error instanceof AppError) throw error;
    console.error("[photo-analysis] failed", error);
    throw new AppError("internal", "The estimate failed. Try again, or log the meal by hand.");
  }
}

/** Saves the user-reviewed estimate as a meal, marked as AI estimated. */
export async function saveAiMeal(userId: string, input: SaveAiMealInput, now: Date = new Date()): Promise<{ mealId: string }> {
  const analysis = await findAnalysis(userId, input.analysisId);
  if (!analysis || analysis.status !== "succeeded") throw new AppError("not_found", "This estimate is no longer available. Take the photo again.");
  if (await analysisAlreadySaved(userId, analysis.id)) throw new AppError("conflict", "This photo was already saved as a meal.");

  const settings = await getUserSettings(userId);
  const today = localDateString(now, settings.timezone);
  const localDate = input.localDate ?? today;
  if (localDate > addDays(today, 1)) throw new AppError("validation", "You cannot log meals that far in the future.");

  const items = input.items.map((item) => ({
    foodId: null,
    name: item.name,
    quantity: item.grams,
    unit: "g" as const,
    grams: item.grams,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
    aiConfidence: item.confidence ?? null,
  }));

  const mealId = await insertMeal({
    userId,
    mealType: input.mealType,
    name: input.name?.trim() ? input.name.trim() : null,
    templateId: null,
    eatenAt: localDate === today ? now : new Date(`${localDate}T12:00:00Z`),
    localDate,
    source: "ai_photo",
    photoAnalysisId: analysis.id,
    items,
  });
  return { mealId };
}

/** Bytes of a stored photo, only for its owner. */
export async function readFoodPhoto(userId: string, analysisId: string): Promise<{ body: Uint8Array; contentType: string } | null> {
  const analysis = await findAnalysis(userId, analysisId);
  if (!analysis) return null;
  const stored = await getStorage().get(analysis.storageKey);
  return stored ? { body: stored.body, contentType: analysis.mimeType } : null;
}
