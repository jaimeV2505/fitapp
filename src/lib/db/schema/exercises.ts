import { sql } from "drizzle-orm";
import { index, pgTable, primaryKey, smallint, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { createdAt, pk, updatedAt } from "./_helpers";
import { equipmentEnum, movementTypeEnum, muscleGroupEnum } from "./enums";
import { user } from "./auth";

/**
 * Exercise catalog. `owner_id IS NULL` means a built-in exercise shared by all users;
 * otherwise it is a custom exercise owned by one user.
 */
export const exercises = pgTable(
  "exercises",
  {
    id: pk(),
    ownerId: text("owner_id").references(() => user.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    primaryMuscle: muscleGroupEnum("primary_muscle").notNull(),
    movementType: movementTypeEnum("movement_type").notNull(),
    equipment: equipmentEnum("equipment"),
    instructions: text("instructions"),
    imageUrl: text("image_url"),
    /** All demo images in order (usually start and end position). */
    imageUrls: text("image_urls").array(),
    defaultSets: smallint("default_sets").notNull().default(3),
    defaultRepMin: smallint("default_rep_min").notNull().default(8),
    defaultRepMax: smallint("default_rep_max").notNull().default(12),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("exercises_builtin_slug_uq").on(t.slug).where(sql`${t.ownerId} is null`),
    uniqueIndex("exercises_owner_slug_uq").on(t.ownerId, t.slug),
    index("exercises_owner_idx").on(t.ownerId),
  ],
);

/** Secondary muscles worked by an exercise. The primary muscle lives on `exercises.primary_muscle`. */
export const exerciseMuscles = pgTable(
  "exercise_muscles",
  {
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
    muscle: muscleGroupEnum("muscle").notNull(),
  },
  (t) => [primaryKey({ columns: [t.exerciseId, t.muscle] })],
);

export type ExerciseRow = typeof exercises.$inferSelect;
export type NewExerciseRow = typeof exercises.$inferInsert;
