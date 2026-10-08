import { eq } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";
import type { WeightUnit } from "@/lib/db/schema/enums";

export interface UserSettingsView {
  timezone: string;
  weightUnit: WeightUnit;
  weekStartsOn: number;
  weeklyWorkoutTarget: number;
  restTimerEnabled: boolean;
  defaultRestSeconds: number;
  targetCalories: number | null;
  targetProteinG: number | null;
  targetCarbsG: number | null;
  targetFatG: number | null;
}

function toView(row: typeof userSettings.$inferSelect): UserSettingsView {
  return {
    timezone: row.timezone,
    weightUnit: row.weightUnit,
    weekStartsOn: row.weekStartsOn,
    weeklyWorkoutTarget: row.weeklyWorkoutTarget,
    restTimerEnabled: row.restTimerEnabled,
    defaultRestSeconds: row.defaultRestSeconds,
    targetCalories: row.targetCalories,
    targetProteinG: row.targetProteinG,
    targetCarbsG: row.targetCarbsG,
    targetFatG: row.targetFatG,
  };
}

/**
 * Settings of a user, or null when the account has not been set up yet.
 * Wrapped in React's per-request cache: a page that asks for the settings from five places still runs one query.
 */
export const findUserSettings = cache(async (userId: string): Promise<UserSettingsView | null> => {
  const [row] = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  return row ? toView(row) : null;
});

export async function getUserSettings(userId: string): Promise<UserSettingsView> {
  const settings = await findUserSettings(userId);
  if (!settings) throw new Error("User settings missing: user was not provisioned");
  return settings;
}
