import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  numeric,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createdAt, pk, updatedAt } from "./_helpers";
import { user } from "./auth";
import { exercises } from "./exercises";
import { muscleGroupEnum, sessionStatusEnum, equipmentEnum } from "./enums";

/* ------------------------------------------------------------------ *
 * PLAN LAYER (mutable): what the user intends to do.
 * Editing anything here must never alter the history layer below.
 * ------------------------------------------------------------------ */

export const workoutPlans = pgTable(
  "workout_plans",
  {
    id: pk(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("workout_plans_user_idx").on(t.userId)],
);

export const workoutDays = pgTable(
  "workout_days",
  {
    id: pk(),
    planId: uuid("plan_id")
      .notNull()
      .references(() => workoutPlans.id, { onDelete: "cascade" }),
    /** "Push Heavy" */
    name: text("name").notNull(),
    /** Short label shown as the big title: "Push" */
    focus: text("focus").notNull(),
    /** ISO weekday: 1 = Monday ... 7 = Sunday. Null = not tied to a weekday. */
    weekday: smallint("weekday"),
    position: smallint("position").notNull(),
  },
  (t) => [index("workout_days_plan_idx").on(t.planId)],
);

/**
 * An exercise inside a plan day, including training metadata (RIR guidance etc.).
 * Intensity guidance is data, not UI copy.
 */
export const workoutDayExercises = pgTable(
  "workout_day_exercises",
  {
    id: pk(),
    workoutDayId: uuid("workout_day_id")
      .notNull()
      .references(() => workoutDays.id, { onDelete: "cascade" }),
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "restrict" }),
    position: smallint("position").notNull(),
    targetSets: smallint("target_sets").notNull(),
    repMin: smallint("rep_min").notNull(),
    repMax: smallint("rep_max").notNull(),
    targetRirMin: smallint("target_rir_min").notNull(),
    targetRirMax: smallint("target_rir_max").notNull(),
    /** Last set may optionally reach technical failure (isolation work). */
    allowFailureOnLastSet: boolean("allow_failure_on_last_set").notNull().default(false),
    /** Null = use the user's default rest time. */
    restSeconds: smallint("rest_seconds"),
    notes: text("notes"),
  },
  (t) => [index("workout_day_exercises_day_idx").on(t.workoutDayId)],
);

/* ------------------------------------------------------------------ *
 * HISTORY LAYER (append-only snapshots): what actually happened.
 * Every value needed to display or analyse a session is copied at start,
 * so renaming/deleting plans or exercises later cannot corrupt history.
 * Foreign keys to the plan layer are nullable + ON DELETE SET NULL.
 * ------------------------------------------------------------------ */

export const workoutSessions = pgTable(
  "workout_sessions",
  {
    id: pk(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    planId: uuid("plan_id").references(() => workoutPlans.id, { onDelete: "set null" }),
    workoutDayId: uuid("workout_day_id").references(() => workoutDays.id, { onDelete: "set null" }),
    /** Snapshot of the day name/focus at start time. */
    nameSnapshot: text("name_snapshot").notNull(),
    focusSnapshot: text("focus_snapshot").notNull(),
    status: sessionStatusEnum("status").notNull().default("in_progress"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    /** Calendar date in the user's timezone when the session started. */
    localDate: date("local_date", { mode: "string" }).notNull(),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("workout_sessions_user_started_idx").on(t.userId, t.startedAt),
    index("workout_sessions_user_date_idx").on(t.userId, t.localDate),
    // A user can only have one workout in progress at a time.
    uniqueIndex("workout_sessions_one_active_uq").on(t.userId).where(sql`${t.status} = 'in_progress'`),
  ],
);

export const exerciseSessions = pgTable(
  "exercise_sessions",
  {
    id: pk(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => workoutSessions.id, { onDelete: "cascade" }),
    exerciseId: uuid("exercise_id").references(() => exercises.id, { onDelete: "set null" }),
    position: smallint("position").notNull(),
    // --- snapshots ---
    nameSnapshot: text("name_snapshot").notNull(),
    primaryMuscleSnapshot: muscleGroupEnum("primary_muscle_snapshot").notNull(),
    secondaryMusclesSnapshot: muscleGroupEnum("secondary_muscles_snapshot").array().notNull().default(sql`'{}'`),
    equipmentSnapshot: equipmentEnum("equipment_snapshot"),
    targetSets: smallint("target_sets").notNull(),
    targetRepMin: smallint("target_rep_min").notNull(),
    targetRepMax: smallint("target_rep_max").notNull(),
    targetRirMin: smallint("target_rir_min").notNull(),
    targetRirMax: smallint("target_rir_max").notNull(),
    allowFailureOnLastSet: boolean("allow_failure_on_last_set").notNull().default(false),
    restSeconds: smallint("rest_seconds").notNull(),
    notes: text("notes"),
  },
  (t) => [
    index("exercise_sessions_session_idx").on(t.sessionId),
    index("exercise_sessions_exercise_idx").on(t.exerciseId),
  ],
);

export const workoutSets = pgTable(
  "workout_sets",
  {
    id: pk(),
    exerciseSessionId: uuid("exercise_session_id")
      .notNull()
      .references(() => exerciseSessions.id, { onDelete: "cascade" }),
    setNumber: smallint("set_number").notNull(),
    isWarmup: boolean("is_warmup").notNull().default(false),
    /** Canonical unit is kilograms; display units are a UI concern. */
    weightKg: numeric("weight_kg", { precision: 6, scale: 2 }),
    reps: smallint("reps"),
    targetRepMin: smallint("target_rep_min"),
    targetRepMax: smallint("target_rep_max"),
    rir: smallint("rir"),
    rpe: numeric("rpe", { precision: 3, scale: 1 }),
    completed: boolean("completed").notNull().default(false),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("workout_sets_exercise_session_number_uq").on(t.exerciseSessionId, t.setNumber),
    index("workout_sets_exercise_session_idx").on(t.exerciseSessionId),
  ],
);

export type WorkoutPlanRow = typeof workoutPlans.$inferSelect;
export type WorkoutDayRow = typeof workoutDays.$inferSelect;
export type WorkoutDayExerciseRow = typeof workoutDayExercises.$inferSelect;
export type WorkoutSessionRow = typeof workoutSessions.$inferSelect;
export type ExerciseSessionRow = typeof exerciseSessions.$inferSelect;
export type WorkoutSetRow = typeof workoutSets.$inferSelect;
