import { pgEnum } from "drizzle-orm/pg-core";

export const MUSCLE_GROUPS = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "forearms",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "adductors",
  "core",
] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];
export const muscleGroupEnum = pgEnum("muscle_group", MUSCLE_GROUPS);

export const EQUIPMENT = ["barbell", "dumbbell", "machine", "cable", "bodyweight", "other"] as const;
export type Equipment = (typeof EQUIPMENT)[number];
export const equipmentEnum = pgEnum("equipment", EQUIPMENT);

export const MOVEMENT_TYPES = ["compound", "isolation"] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];
export const movementTypeEnum = pgEnum("movement_type", MOVEMENT_TYPES);

export const SESSION_STATUSES = ["in_progress", "completed", "abandoned"] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];
export const sessionStatusEnum = pgEnum("session_status", SESSION_STATUSES);

export const MEAL_TYPES = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "pre_workout",
  "post_workout",
  "before_bed",
] as const;
export type MealType = (typeof MEAL_TYPES)[number];
export const mealTypeEnum = pgEnum("meal_type", MEAL_TYPES);

export const QUANTITY_UNITS = ["g", "ml", "piece"] as const;
export type QuantityUnit = (typeof QUANTITY_UNITS)[number];
export const quantityUnitEnum = pgEnum("quantity_unit", QUANTITY_UNITS);

export const ENTRY_SOURCES = ["manual", "template", "ai_photo"] as const;
export type EntrySource = (typeof ENTRY_SOURCES)[number];
export const entrySourceEnum = pgEnum("entry_source", ENTRY_SOURCES);

export const CONFIDENCE_LEVELS = ["high", "medium", "low"] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];
export const confidenceEnum = pgEnum("confidence_level", CONFIDENCE_LEVELS);

export const ANALYSIS_STATUSES = ["pending", "succeeded", "failed"] as const;
export type AnalysisStatus = (typeof ANALYSIS_STATUSES)[number];
export const analysisStatusEnum = pgEnum("analysis_status", ANALYSIS_STATUSES);

export const WEIGHT_UNITS = ["kg", "lb"] as const;
export type WeightUnit = (typeof WEIGHT_UNITS)[number];
export const weightUnitEnum = pgEnum("weight_unit", WEIGHT_UNITS);

export const THEMES = ["system", "light", "dark"] as const;
export type ThemePreference = (typeof THEMES)[number];
export const themeEnum = pgEnum("theme_preference", THEMES);

export const PROGRESS_METRIC_TYPES = [
  "pr_weight",
  "pr_reps",
  "pr_e1rm",
  "pr_volume",
] as const;
export type ProgressMetricType = (typeof PROGRESS_METRIC_TYPES)[number];
export const progressMetricTypeEnum = pgEnum("progress_metric_type", PROGRESS_METRIC_TYPES);
