import { eq } from "drizzle-orm";
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

export async function getUserSettings(userId: string): Promise<UserSettingsView> {
  const [row] = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  if (!row) throw new Error("User settings missing: user was not provisioned");
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
