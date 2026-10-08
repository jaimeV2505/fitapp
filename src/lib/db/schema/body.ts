import { date, index, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createdAt, pk } from "./_helpers";
import { user } from "./auth";
import { exercises } from "./exercises";
import { progressMetricTypeEnum } from "./enums";
import { workoutSets } from "./workouts";

export const bodyMeasurements = pgTable(
  "body_measurements",
  {
    id: pk(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    measuredAt: timestamp("measured_at", { withTimezone: true }).notNull().defaultNow(),
    localDate: date("local_date", { mode: "string" }).notNull(),
    weightKg: numeric("weight_kg", { precision: 5, scale: 2 }),
    bodyFatPercent: numeric("body_fat_percent", { precision: 4, scale: 1 }),
    waistCm: numeric("waist_cm", { precision: 5, scale: 1 }),
    chestCm: numeric("chest_cm", { precision: 5, scale: 1 }),
    armCm: numeric("arm_cm", { precision: 5, scale: 1 }),
    legCm: numeric("leg_cm", { precision: 5, scale: 1 }),
    notes: text("notes"),
    createdAt: createdAt(),
  },
  (t) => [index("body_measurements_user_date_idx").on(t.userId, t.localDate)],
);

/** Derived records such as personal bests. Recomputable from workout history (Phase 3). */
export const progressMetrics = pgTable(
  "progress_metrics",
  {
    id: pk(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: progressMetricTypeEnum("type").notNull(),
    exerciseId: uuid("exercise_id").references(() => exercises.id, { onDelete: "set null" }),
    exerciseNameSnapshot: text("exercise_name_snapshot"),
    value: numeric("value", { precision: 10, scale: 2 }).notNull(),
    achievedAt: timestamp("achieved_at", { withTimezone: true }).notNull(),
    sourceSetId: uuid("source_set_id").references(() => workoutSets.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [index("progress_metrics_user_type_idx").on(t.userId, t.type, t.exerciseId)],
);
