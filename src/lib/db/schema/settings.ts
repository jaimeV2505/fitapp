import { boolean, integer, pgTable, smallint, text, timestamp } from "drizzle-orm/pg-core";
import { updatedAt } from "./_helpers";
import { user } from "./auth";
import { themeEnum, weightUnitEnum } from "./enums";

export const userSettings = pgTable("user_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  timezone: text("timezone").notNull().default("UTC"),
  weightUnit: weightUnitEnum("weight_unit").notNull().default("kg"),
  theme: themeEnum("theme").notNull().default("system"),
  /** 1 = Monday ... 7 = Sunday */
  weekStartsOn: smallint("week_starts_on").notNull().default(1),
  weeklyWorkoutTarget: smallint("weekly_workout_target").notNull().default(5),
  restTimerEnabled: boolean("rest_timer_enabled").notNull().default(true),
  defaultRestSeconds: smallint("default_rest_seconds").notNull().default(120),
  /** Nutrition targets are entered by the user. The app never prescribes them. */
  targetCalories: integer("target_calories"),
  targetProteinG: integer("target_protein_g"),
  targetCarbsG: integer("target_carbs_g"),
  targetFatG: integer("target_fat_g"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: updatedAt(),
});

export type UserSettingsRow = typeof userSettings.$inferSelect;
