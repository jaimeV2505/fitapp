import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
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
import {
  analysisStatusEnum,
  confidenceEnum,
  entrySourceEnum,
  mealTypeEnum,
  quantityUnitEnum,
} from "./enums";

/**
 * Foods. `owner_id IS NULL` = built-in catalog entry. Nutrition values are per 100 g (or 100 ml)
 * and are fully editable; they are estimates, never medical facts.
 */
export const foods = pgTable(
  "foods",
  {
    id: pk(),
    ownerId: text("owner_id").references(() => user.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    brand: text("brand"),
    caloriesPer100: numeric("calories_per_100", { precision: 7, scale: 2 }).notNull(),
    proteinPer100: numeric("protein_per_100", { precision: 6, scale: 2 }).notNull(),
    carbsPer100: numeric("carbs_per_100", { precision: 6, scale: 2 }).notNull(),
    fatPer100: numeric("fat_per_100", { precision: 6, scale: 2 }).notNull(),
    /** Natural unit for "3 eggs", "1 scoop": label + grams per piece. */
    pieceLabel: text("piece_label"),
    pieceGrams: numeric("piece_grams", { precision: 7, scale: 2 }),
    /** Where the numbers came from: 'seed_estimate' | 'user' | 'label' ... */
    nutritionSource: text("nutrition_source").notNull().default("user"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("foods_builtin_slug_uq").on(t.slug).where(sql`${t.ownerId} is null`),
    uniqueIndex("foods_owner_slug_uq").on(t.ownerId, t.slug),
    index("foods_owner_idx").on(t.ownerId),
  ],
);

/* ---------------- templates (mutable) ---------------- */

export const mealTemplates = pgTable(
  "meal_templates",
  {
    id: pk(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    mealType: mealTypeEnum("meal_type").notNull(),
    position: smallint("position").notNull().default(0),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("meal_templates_user_idx").on(t.userId)],
);

export const mealTemplateItems = pgTable(
  "meal_template_items",
  {
    id: pk(),
    templateId: uuid("template_id")
      .notNull()
      .references(() => mealTemplates.id, { onDelete: "cascade" }),
    foodId: uuid("food_id")
      .notNull()
      .references(() => foods.id, { onDelete: "restrict" }),
    quantity: numeric("quantity", { precision: 8, scale: 2 }).notNull(),
    unit: quantityUnitEnum("unit").notNull(),
    position: smallint("position").notNull().default(0),
    /** Items sharing an option group are alternatives (e.g. "liquid": water | milk). One is chosen when logging. */
    optionGroup: text("option_group"),
    isDefaultOption: boolean("is_default_option").notNull().default(true),
  },
  (t) => [index("meal_template_items_template_idx").on(t.templateId)],
);

/* ---------------- meal log (append-only snapshots) ---------------- */

export const meals = pgTable(
  "meals",
  {
    id: pk(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    mealType: mealTypeEnum("meal_type").notNull(),
    name: text("name"),
    eatenAt: timestamp("eaten_at", { withTimezone: true }).notNull().defaultNow(),
    localDate: date("local_date", { mode: "string" }).notNull(),
    source: entrySourceEnum("source").notNull().default("manual"),
    templateId: uuid("template_id").references(() => mealTemplates.id, { onDelete: "set null" }),
    photoAnalysisId: uuid("photo_analysis_id"),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("meals_user_date_idx").on(t.userId, t.localDate)],
);

/** Nutrition values are copied (not referenced) so editing a food never rewrites past meals. */
export const mealItems = pgTable(
  "meal_items",
  {
    id: pk(),
    mealId: uuid("meal_id")
      .notNull()
      .references(() => meals.id, { onDelete: "cascade" }),
    foodId: uuid("food_id").references(() => foods.id, { onDelete: "set null" }),
    nameSnapshot: text("name_snapshot").notNull(),
    quantity: numeric("quantity", { precision: 8, scale: 2 }).notNull(),
    unit: quantityUnitEnum("unit").notNull(),
    grams: numeric("grams", { precision: 8, scale: 2 }).notNull(),
    calories: numeric("calories", { precision: 8, scale: 2 }).notNull(),
    protein: numeric("protein", { precision: 7, scale: 2 }).notNull(),
    carbs: numeric("carbs", { precision: 7, scale: 2 }).notNull(),
    fat: numeric("fat", { precision: 7, scale: 2 }).notNull(),
    /** Per-item confidence for AI-estimated rows (0..1). Null for manual entries. */
    aiConfidence: numeric("ai_confidence", { precision: 3, scale: 2 }),
  },
  (t) => [index("meal_items_meal_idx").on(t.mealId)],
);

/** Phase 2: one row per food photo sent to the AI provider. */
export const foodPhotoAnalyses = pgTable(
  "food_photo_analyses",
  {
    id: pk(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: analysisStatusEnum("status").notNull().default("pending"),
    storageKey: text("storage_key").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    provider: text("provider"),
    model: text("model"),
    /** Validated, normalised result (never the raw model text). */
    result: jsonb("result"),
    confidence: confidenceEnum("confidence"),
    errorMessage: text("error_message"),
    createdAt: createdAt(),
  },
  (t) => [index("food_photo_analyses_user_idx").on(t.userId, t.createdAt)],
);

export type FoodRow = typeof foods.$inferSelect;
export type MealRow = typeof meals.$inferSelect;
export type MealItemRow = typeof mealItems.$inferSelect;
