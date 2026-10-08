import { and, asc, desc, eq, ilike, inArray, isNull, ne, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { exerciseMuscles, exerciseSessions, exercises, workoutSessions, workoutSets } from "@/lib/db/schema";
import type { Equipment, MovementType, MuscleGroup } from "@/lib/db/schema/enums";
import type { ExerciseListItem, HistorySetRow } from "./types";

export interface ExerciseRecord {
  id: string;
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment | null;
  imageUrls: string[];
  instructions: string | null;
}

/** Built-in exercises and the user's own custom ones. */
export async function findVisibleExercise(userId: string, exerciseId: string): Promise<ExerciseRecord | null> {
  const [row] = await db
    .select()
    .from(exercises)
    .where(and(eq(exercises.id, exerciseId), or(isNull(exercises.ownerId), eq(exercises.ownerId, userId))))
    .limit(1);
  if (!row) return null;

  const secondary = await db
    .select({ muscle: exerciseMuscles.muscle })
    .from(exerciseMuscles)
    .where(eq(exerciseMuscles.exerciseId, row.id));

  return {
    id: row.id,
    name: row.name,
    primaryMuscle: row.primaryMuscle,
    secondaryMuscles: secondary.map((s) => s.muscle),
    equipment: row.equipment,
    imageUrls: row.imageUrls ?? [],
    instructions: row.instructions,
  };
}

/**
 * Completed working sets of one exercise from finished sessions, newest first.
 * The cap bounds the work for very long histories; it is far above 12 sessions of sets.
 */
export async function listHistorySets(userId: string, exerciseId: string, limit = 600): Promise<HistorySetRow[]> {
  const rows = await db
    .select({
      sessionId: workoutSessions.id,
      localDate: workoutSessions.localDate,
      weightKg: workoutSets.weightKg,
      reps: workoutSets.reps,
    })
    .from(workoutSets)
    .innerJoin(exerciseSessions, eq(exerciseSessions.id, workoutSets.exerciseSessionId))
    .innerJoin(workoutSessions, eq(workoutSessions.id, exerciseSessions.sessionId))
    .where(
      and(
        eq(workoutSessions.userId, userId),
        ne(workoutSessions.status, "in_progress"),
        eq(exerciseSessions.exerciseId, exerciseId),
        eq(workoutSets.completed, true),
        eq(workoutSets.isWarmup, false),
      ),
    )
    .orderBy(desc(workoutSessions.startedAt), workoutSets.setNumber)
    .limit(limit);

  return rows.map((row) => ({
    sessionId: row.sessionId,
    localDate: row.localDate,
    weightKg: row.weightKg === null ? null : Number(row.weightKg),
    reps: row.reps,
  }));
}

/** Library search over built-in and own exercises. Results are capped to keep the page light. */
export async function searchExercises(
  userId: string,
  filters: { query?: string; muscle?: MuscleGroup },
  limit = 60,
): Promise<ExerciseListItem[]> {
  const rows = await db
    .select({
      id: exercises.id,
      name: exercises.name,
      primaryMuscle: exercises.primaryMuscle,
      equipment: exercises.equipment,
      imageUrl: exercises.imageUrl,
    })
    .from(exercises)
    .where(
      and(
        isNull(exercises.archivedAt),
        or(isNull(exercises.ownerId), eq(exercises.ownerId, userId)),
        filters.muscle ? eq(exercises.primaryMuscle, filters.muscle) : undefined,
        filters.query ? ilike(exercises.name, `%${filters.query.replace(/[%_]/g, "")}%`) : undefined,
      ),
    )
    .orderBy(asc(exercises.name))
    .limit(limit);
  return rows;
}

export interface ExerciseBasics {
  id: string;
  movementType: MovementType;
  equipment: Equipment | null;
}

/** The subset of the given ids that the user may use (built-in or their own). */
export async function listVisibleExerciseBasics(userId: string, ids: readonly string[]): Promise<Map<string, ExerciseBasics>> {
  if (ids.length === 0) return new Map();
  const rows = await db
    .select({ id: exercises.id, movementType: exercises.movementType, equipment: exercises.equipment })
    .from(exercises)
    .where(and(inArray(exercises.id, [...ids]), or(isNull(exercises.ownerId), eq(exercises.ownerId, userId))));
  return new Map(rows.map((row) => [row.id, row]));
}

export async function customSlugExists(userId: string, slug: string): Promise<boolean> {
  const [row] = await db
    .select({ id: exercises.id })
    .from(exercises)
    .where(and(eq(exercises.ownerId, userId), eq(exercises.slug, slug)))
    .limit(1);
  return row !== undefined;
}

export async function insertCustomExercise(input: {
  userId: string;
  slug: string;
  name: string;
  primaryMuscle: MuscleGroup;
  equipment: Equipment | null;
  movementType: MovementType;
}): Promise<ExerciseListItem> {
  const isolation = input.movementType === "isolation";
  const [row] = await db
    .insert(exercises)
    .values({
      ownerId: input.userId,
      slug: input.slug,
      name: input.name,
      primaryMuscle: input.primaryMuscle,
      equipment: input.equipment,
      movementType: input.movementType,
      defaultSets: 3,
      defaultRepMin: isolation ? 10 : 6,
      defaultRepMax: isolation ? 15 : 10,
    })
    .returning({
      id: exercises.id,
      name: exercises.name,
      primaryMuscle: exercises.primaryMuscle,
      equipment: exercises.equipment,
      imageUrl: exercises.imageUrl,
    });
  if (!row) throw new Error("Failed to create exercise");
  return row;
}
