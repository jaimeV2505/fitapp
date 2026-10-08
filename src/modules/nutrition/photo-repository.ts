import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { foodPhotoAnalyses, meals } from "@/lib/db/schema";
import type { ConfidenceLevel } from "@/lib/db/schema/enums";

export async function insertAnalysis(input: {
  userId: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  provider: string;
  model: string;
}): Promise<string> {
  const [row] = await db.insert(foodPhotoAnalyses).values({ ...input, status: "pending" }).returning({ id: foodPhotoAnalyses.id });
  if (!row) throw new Error("Failed to create analysis");
  return row.id;
}

export async function markAnalysisSucceeded(id: string, result: unknown, confidence: ConfidenceLevel): Promise<void> {
  await db.update(foodPhotoAnalyses).set({ status: "succeeded", result, confidence }).where(eq(foodPhotoAnalyses.id, id));
}

export async function markAnalysisFailed(id: string, message: string): Promise<void> {
  await db.update(foodPhotoAnalyses).set({ status: "failed", errorMessage: message.slice(0, 500) }).where(eq(foodPhotoAnalyses.id, id));
}

export async function findAnalysis(userId: string, id: string) {
  const [row] = await db
    .select()
    .from(foodPhotoAnalyses)
    .where(and(eq(foodPhotoAnalyses.id, id), eq(foodPhotoAnalyses.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function analysisAlreadySaved(userId: string, analysisId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: meals.id })
    .from(meals)
    .where(and(eq(meals.userId, userId), eq(meals.photoAnalysisId, analysisId)))
    .limit(1);
  return row !== undefined;
}
