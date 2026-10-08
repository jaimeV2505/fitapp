import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";
import { ensureBuiltInExercises } from "@/modules/exercises/catalog";
import { ensureBuiltInFoods } from "@/modules/foods/catalog";
import { createStarterMealTemplates } from "@/modules/nutrition/starter-templates";
import { createStarterPlan } from "@/modules/workouts/starter-plan";

export async function isUserProvisioned(userId: string): Promise<boolean> {
  const rows = await db
    .select({ userId: userSettings.userId })
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);
  return rows.length > 0;
}

/**
 * Gives a new user their settings, the starter workout routine and the starter meal templates.
 * Idempotent and safe under concurrent requests: the settings row is the guard, and the whole
 * thing runs in one transaction. Returns true when this call did the provisioning.
 */
export async function ensureUserProvisioned(userId: string, timezone: string): Promise<boolean> {
  if (await isUserProvisioned(userId)) return false;

  return db.transaction(async (tx) => {
    const inserted = await tx
      .insert(userSettings)
      .values({ userId, timezone })
      .onConflictDoNothing()
      .returning({ userId: userSettings.userId });
    if (inserted.length === 0) return false;

    const exerciseIds = await ensureBuiltInExercises(tx);
    const foodIds = await ensureBuiltInFoods(tx);
    await createStarterPlan(tx, userId, exerciseIds);
    await createStarterMealTemplates(tx, userId, foodIds);
    return true;
  });
}
