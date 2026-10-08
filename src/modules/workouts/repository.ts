import { and, asc, desc, eq, gte, inArray, lte, ne, sql } from "drizzle-orm";
import { db, type DbExecutor } from "@/lib/db";
import {
  exerciseMuscles,
  exerciseSessions,
  exercises,
  workoutDayExercises,
  workoutDays,
  workoutPlans,
  workoutSessions,
  workoutSets,
} from "@/lib/db/schema";
import type { MuscleGroup } from "@/lib/db/schema/enums";
import type { ExerciseBests } from "./domain/records";
import type { ExerciseBlueprint, PlanItemInput } from "./domain/blueprint";
import type {
  DayPreviewItem,
  ExerciseSessionView,
  PlanDayDetail,
  PlanDayOverview,
  PreviousPerformance,
  SaveSetInput,
  SessionSummary,
  SessionView,
  SetView,
} from "./types";

/* ---------- mapping helpers (numeric columns come back as strings) ---------- */

function toNumber(value: string | null): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toSetView(row: typeof workoutSets.$inferSelect): SetView {
  return {
    id: row.id,
    setNumber: row.setNumber,
    isWarmup: row.isWarmup,
    weightKg: toNumber(row.weightKg),
    reps: row.reps,
    rir: row.rir,
    completed: row.completed,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
  };
}

/** Sessions that belong to the user and are still in progress: the only ones that may be edited. */
function editableExerciseSessionIds(userId: string) {
  return db
    .select({ id: exerciseSessions.id })
    .from(exerciseSessions)
    .innerJoin(workoutSessions, eq(workoutSessions.id, exerciseSessions.sessionId))
    .where(and(eq(workoutSessions.userId, userId), eq(workoutSessions.status, "in_progress")));
}

/* ---------- plan queries ---------- */

export async function listActivePlanDays(userId: string): Promise<PlanDayOverview[]> {
  const rows = await db
    .select({
      id: workoutDays.id,
      name: workoutDays.name,
      focus: workoutDays.focus,
      weekday: workoutDays.weekday,
      exerciseCount: sql<number>`count(${workoutDayExercises.id})::int`,
      totalSets: sql<number>`coalesce(sum(${workoutDayExercises.targetSets}), 0)::int`,
    })
    .from(workoutDays)
    .innerJoin(workoutPlans, eq(workoutPlans.id, workoutDays.planId))
    .leftJoin(workoutDayExercises, eq(workoutDayExercises.workoutDayId, workoutDays.id))
    .where(and(eq(workoutPlans.userId, userId), eq(workoutPlans.isActive, true)))
    .groupBy(workoutDays.id)
    .orderBy(asc(workoutDays.position));
  if (rows.length === 0) return [];

  const items = await db
    .select({
      dayId: workoutDayExercises.workoutDayId,
      imageUrl: exercises.imageUrl,
      muscle: exercises.primaryMuscle,
    })
    .from(workoutDayExercises)
    .innerJoin(exercises, eq(exercises.id, workoutDayExercises.exerciseId))
    .where(inArray(workoutDayExercises.workoutDayId, rows.map((r) => r.id)))
    .orderBy(asc(workoutDayExercises.workoutDayId), asc(workoutDayExercises.position));

  return rows.map((row) => {
    const own = items.filter((item) => item.dayId === row.id);
    const images = own.flatMap((item) => (item.imageUrl ? [item.imageUrl] : []));
    return {
      ...row,
      previewImages: [...new Set(images)].slice(0, 4),
      muscles: [...new Set(own.map((item) => item.muscle))],
    };
  });
}

export interface PlanDayRef {
  id: string;
  planId: string;
  name: string;
  focus: string;
}

export async function findPlanDay(userId: string, dayId: string): Promise<PlanDayRef | null> {
  const [row] = await db
    .select({ id: workoutDays.id, planId: workoutDays.planId, name: workoutDays.name, focus: workoutDays.focus })
    .from(workoutDays)
    .innerJoin(workoutPlans, eq(workoutPlans.id, workoutDays.planId))
    .where(and(eq(workoutDays.id, dayId), eq(workoutPlans.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function listPlanItems(userId: string, dayId: string): Promise<PlanItemInput[]> {
  const rows = await db
    .select({
      exerciseId: exercises.id,
      exerciseName: exercises.name,
      primaryMuscle: exercises.primaryMuscle,
      equipment: exercises.equipment,
      position: workoutDayExercises.position,
      targetSets: workoutDayExercises.targetSets,
      repMin: workoutDayExercises.repMin,
      repMax: workoutDayExercises.repMax,
      targetRirMin: workoutDayExercises.targetRirMin,
      targetRirMax: workoutDayExercises.targetRirMax,
      allowFailureOnLastSet: workoutDayExercises.allowFailureOnLastSet,
      restSeconds: workoutDayExercises.restSeconds,
    })
    .from(workoutDayExercises)
    .innerJoin(exercises, eq(exercises.id, workoutDayExercises.exerciseId))
    .innerJoin(workoutDays, eq(workoutDays.id, workoutDayExercises.workoutDayId))
    .innerJoin(workoutPlans, eq(workoutPlans.id, workoutDays.planId))
    .where(and(eq(workoutDayExercises.workoutDayId, dayId), eq(workoutPlans.userId, userId)))
    .orderBy(asc(workoutDayExercises.position));

  if (rows.length === 0) return [];

  const muscleRows = await db
    .select({ exerciseId: exerciseMuscles.exerciseId, muscle: exerciseMuscles.muscle })
    .from(exerciseMuscles)
    .where(inArray(exerciseMuscles.exerciseId, rows.map((r) => r.exerciseId)));

  const secondaryByExercise = new Map<string, MuscleGroup[]>();
  for (const { exerciseId, muscle } of muscleRows) {
    const list = secondaryByExercise.get(exerciseId) ?? [];
    list.push(muscle);
    secondaryByExercise.set(exerciseId, list);
  }

  return rows.map((row) => ({ ...row, secondaryMuscles: secondaryByExercise.get(row.exerciseId) ?? [] }));
}

/* ---------- session lifecycle ---------- */

export async function findActiveSession(
  userId: string,
): Promise<{ id: string; startedAt: Date } | null> {
  const [row] = await db
    .select({ id: workoutSessions.id, startedAt: workoutSessions.startedAt })
    .from(workoutSessions)
    .where(and(eq(workoutSessions.userId, userId), eq(workoutSessions.status, "in_progress")))
    .limit(1);
  return row ?? null;
}

export interface NewSessionInput {
  userId: string;
  planId: string;
  dayId: string;
  name: string;
  focus: string;
  localDate: string;
  startedAt: Date;
  exercises: readonly ExerciseBlueprint[];
}

/** Creates a session with all of its exercise and set rows atomically. */
export async function insertSessionFromBlueprint(input: NewSessionInput): Promise<string> {
  return db.transaction(async (tx) => {
    const [session] = await tx
      .insert(workoutSessions)
      .values({
        userId: input.userId,
        planId: input.planId,
        workoutDayId: input.dayId,
        nameSnapshot: input.name,
        focusSnapshot: input.focus,
        localDate: input.localDate,
        startedAt: input.startedAt,
        status: "in_progress",
      })
      .returning({ id: workoutSessions.id });
    if (!session) throw new Error("Failed to create workout session");

    if (input.exercises.length === 0) return session.id;

    const insertedExercises = await tx
      .insert(exerciseSessions)
      .values(
        input.exercises.map((exercise) => ({
          sessionId: session.id,
          exerciseId: exercise.exerciseId,
          position: exercise.position,
          nameSnapshot: exercise.nameSnapshot,
          primaryMuscleSnapshot: exercise.primaryMuscleSnapshot,
          secondaryMusclesSnapshot: exercise.secondaryMusclesSnapshot,
          equipmentSnapshot: exercise.equipmentSnapshot,
          targetSets: exercise.targetSets,
          targetRepMin: exercise.targetRepMin,
          targetRepMax: exercise.targetRepMax,
          targetRirMin: exercise.targetRirMin,
          targetRirMax: exercise.targetRirMax,
          allowFailureOnLastSet: exercise.allowFailureOnLastSet,
          restSeconds: exercise.restSeconds,
        })),
      )
      .returning({ id: exerciseSessions.id, position: exerciseSessions.position });

    const idByPosition = new Map(insertedExercises.map((row) => [row.position, row.id]));
    const setRows = input.exercises.flatMap((exercise) => {
      const exerciseSessionId = idByPosition.get(exercise.position);
      if (!exerciseSessionId) throw new Error("Exercise session id missing after insert");
      return exercise.sets.map((set) => ({
        exerciseSessionId,
        setNumber: set.setNumber,
        targetRepMin: set.targetRepMin,
        targetRepMax: set.targetRepMax,
      }));
    });
    if (setRows.length > 0) await tx.insert(workoutSets).values(setRows);

    return session.id;
  });
}

export async function markSessionFinished(
  userId: string,
  sessionId: string,
  status: "completed" | "abandoned",
  completedAt: Date,
  executor: DbExecutor = db,
): Promise<boolean> {
  const rows = await executor
    .update(workoutSessions)
    .set({ status, completedAt })
    .where(
      and(
        eq(workoutSessions.id, sessionId),
        eq(workoutSessions.userId, userId),
        eq(workoutSessions.status, "in_progress"),
      ),
    )
    .returning({ id: workoutSessions.id });
  return rows.length > 0;
}

/** Latest completed-set timestamp of a session; used to close stale sessions at a sensible time. */
export async function findLastSetActivity(sessionId: string): Promise<Date | null> {
  const [row] = await db
    .select({ last: sql<Date | null>`max(${workoutSets.completedAt})` })
    .from(workoutSets)
    .innerJoin(exerciseSessions, eq(exerciseSessions.id, workoutSets.exerciseSessionId))
    .where(eq(exerciseSessions.sessionId, sessionId));
  return row?.last ? new Date(row.last) : null;
}

/* ---------- reading a session ---------- */

export async function getSessionView(userId: string, sessionId: string): Promise<SessionView | null> {
  const [session] = await db
    .select()
    .from(workoutSessions)
    .where(and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, userId)))
    .limit(1);
  if (!session) return null;

  const exerciseRows = await db
    .select()
    .from(exerciseSessions)
    .where(eq(exerciseSessions.sessionId, session.id))
    .orderBy(asc(exerciseSessions.position));

  const exerciseSessionIds = exerciseRows.map((row) => row.id);
  const setRows =
    exerciseSessionIds.length === 0
      ? []
      : await db
          .select()
          .from(workoutSets)
          .where(inArray(workoutSets.exerciseSessionId, exerciseSessionIds))
          .orderBy(asc(workoutSets.exerciseSessionId), asc(workoutSets.setNumber));

  const setsByExerciseSession = new Map<string, SetView[]>();
  for (const row of setRows) {
    const list = setsByExerciseSession.get(row.exerciseSessionId) ?? [];
    list.push(toSetView(row));
    setsByExerciseSession.set(row.exerciseSessionId, list);
  }

  const previousByExercise =
    session.status === "in_progress"
      ? await getPreviousPerformance(
          userId,
          exerciseRows.flatMap((row) => (row.exerciseId ? [row.exerciseId] : [])),
          session.workoutDayId,
        )
      : new Map<string, PreviousPerformance>();

  const liveExerciseIds = exerciseRows.flatMap((row) => (row.exerciseId ? [row.exerciseId] : []));
  const imageRows =
    liveExerciseIds.length === 0
      ? []
      : await db
          .select({ id: exercises.id, imageUrls: exercises.imageUrls })
          .from(exercises)
          .where(inArray(exercises.id, liveExerciseIds));
  const imagesByExercise = new Map(imageRows.map((row) => [row.id, row.imageUrls ?? []]));

  const bestsByExercise =
    session.status === "in_progress" ? await getExerciseBests(userId, liveExerciseIds) : new Map<string, ExerciseBests>();

  const exercisesView: ExerciseSessionView[] = exerciseRows.map((row) => ({
    id: row.id,
    exerciseId: row.exerciseId,
    name: row.nameSnapshot,
    primaryMuscle: row.primaryMuscleSnapshot,
    secondaryMuscles: row.secondaryMusclesSnapshot,
    imageUrls: row.exerciseId ? (imagesByExercise.get(row.exerciseId) ?? []) : [],
    bests: row.exerciseId ? (bestsByExercise.get(row.exerciseId) ?? null) : null,
    equipment: row.equipmentSnapshot,
    position: row.position,
    targetSets: row.targetSets,
    repMin: row.targetRepMin,
    repMax: row.targetRepMax,
    rirMin: row.targetRirMin,
    rirMax: row.targetRirMax,
    allowFailureOnLastSet: row.allowFailureOnLastSet,
    restSeconds: row.restSeconds,
    sets: setsByExerciseSession.get(row.id) ?? [],
    previous: row.exerciseId ? (previousByExercise.get(row.exerciseId) ?? null) : null,
  }));

  return {
    id: session.id,
    name: session.nameSnapshot,
    focus: session.focusSnapshot,
    status: session.status,
    startedAt: session.startedAt.toISOString(),
    completedAt: session.completedAt ? session.completedAt.toISOString() : null,
    localDate: session.localDate,
    exercises: exercisesView,
  };
}

/**
 * For each exercise, the most recent finished session that contains a completed working set.
 * Sessions of the same plan day are preferred (Monday's heavy sets are not the right comparison
 * for Thursday's volume work); otherwise the most recent session of any day is used.
 */
export async function getPreviousPerformance(
  userId: string,
  exerciseIds: readonly string[],
  preferDayId: string | null,
): Promise<Map<string, PreviousPerformance>> {
  const result = new Map<string, PreviousPerformance>();
  if (exerciseIds.length === 0) return result;

  const sameDayFirst = sql`(${workoutSessions.workoutDayId} is not distinct from ${preferDayId}::uuid) desc`;

  const picks = await db
    .selectDistinctOn([exerciseSessions.exerciseId], {
      exerciseId: exerciseSessions.exerciseId,
      exerciseSessionId: exerciseSessions.id,
      localDate: workoutSessions.localDate,
    })
    .from(exerciseSessions)
    .innerJoin(workoutSessions, eq(workoutSessions.id, exerciseSessions.sessionId))
    .where(
      and(
        eq(workoutSessions.userId, userId),
        ne(workoutSessions.status, "in_progress"),
        inArray(exerciseSessions.exerciseId, [...exerciseIds]),
        sql`exists (
          select 1 from ${workoutSets}
          where ${workoutSets.exerciseSessionId} = ${exerciseSessions.id}
            and ${workoutSets.completed} = true
            and ${workoutSets.isWarmup} = false
        )`,
      ),
    )
    .orderBy(exerciseSessions.exerciseId, sameDayFirst, desc(workoutSessions.startedAt));

  if (picks.length === 0) return result;

  const setRows = await db
    .select({
      exerciseSessionId: workoutSets.exerciseSessionId,
      weightKg: workoutSets.weightKg,
      reps: workoutSets.reps,
      rir: workoutSets.rir,
    })
    .from(workoutSets)
    .where(
      and(
        inArray(workoutSets.exerciseSessionId, picks.map((p) => p.exerciseSessionId)),
        eq(workoutSets.completed, true),
        eq(workoutSets.isWarmup, false),
      ),
    )
    .orderBy(asc(workoutSets.setNumber));

  for (const pick of picks) {
    if (!pick.exerciseId) continue;
    result.set(pick.exerciseId, {
      localDate: pick.localDate,
      sets: setRows
        .filter((row) => row.exerciseSessionId === pick.exerciseSessionId)
        .map((row) => ({ weightKg: toNumber(row.weightKg), reps: row.reps, rir: row.rir })),
    });
  }
  return result;
}

/* ---------- set mutations ---------- */

export async function updateSet(userId: string, input: SaveSetInput): Promise<SetView | null> {
  const [row] = await db
    .update(workoutSets)
    .set({
      weightKg: input.weightKg === null ? null : input.weightKg.toFixed(2),
      reps: input.reps,
      rir: input.rir,
      completed: input.completed,
      completedAt: input.completed ? new Date(input.completedAt ?? Date.now()) : null,
    })
    .where(
      and(
        eq(workoutSets.id, input.setId),
        inArray(workoutSets.exerciseSessionId, editableExerciseSessionIds(userId)),
      ),
    )
    .returning();
  return row ? toSetView(row) : null;
}

/** Appends one extra set to an exercise, copying its rep targets. Returns null if not allowed. */
export async function appendSet(userId: string, exerciseSessionId: string): Promise<SetView | null> {
  const [owned] = await db
    .select({
      id: exerciseSessions.id,
      targetRepMin: exerciseSessions.targetRepMin,
      targetRepMax: exerciseSessions.targetRepMax,
    })
    .from(exerciseSessions)
    .where(and(eq(exerciseSessions.id, exerciseSessionId), inArray(exerciseSessions.id, editableExerciseSessionIds(userId))))
    .limit(1);
  if (!owned) return null;

  const [row] = await db
    .insert(workoutSets)
    .values({
      exerciseSessionId,
      setNumber: sql<number>`(select coalesce(max(${workoutSets.setNumber}), 0) + 1 from ${workoutSets} where ${workoutSets.exerciseSessionId} = ${exerciseSessionId})`,
      targetRepMin: owned.targetRepMin,
      targetRepMax: owned.targetRepMax,
    })
    .returning();
  return row ? toSetView(row) : null;
}

/** Removes an extra (beyond-target), not yet completed set. */
export async function deleteExtraSet(userId: string, setId: string): Promise<boolean> {
  const [row] = await db
    .select({
      id: workoutSets.id,
      setNumber: workoutSets.setNumber,
      completed: workoutSets.completed,
      targetSets: exerciseSessions.targetSets,
    })
    .from(workoutSets)
    .innerJoin(exerciseSessions, eq(exerciseSessions.id, workoutSets.exerciseSessionId))
    .where(and(eq(workoutSets.id, setId), inArray(exerciseSessions.id, editableExerciseSessionIds(userId))))
    .limit(1);
  if (!row || row.completed || row.setNumber <= row.targetSets) return false;
  await db.delete(workoutSets).where(eq(workoutSets.id, setId));
  return true;
}

/* ---------- history & weekly counts ---------- */

const workingCompleted = sql`${workoutSets.completed} and not ${workoutSets.isWarmup}`;

export async function listSessionSummaries(userId: string, limit: number): Promise<SessionSummary[]> {
  const rows = await db
    .select({
      id: workoutSessions.id,
      name: workoutSessions.nameSnapshot,
      focus: workoutSessions.focusSnapshot,
      localDate: workoutSessions.localDate,
      completedAt: workoutSessions.completedAt,
      status: workoutSessions.status,
      completedSets: sql<number>`count(${workoutSets.id}) filter (where ${workingCompleted})::int`,
      totalVolumeKg: sql<number>`coalesce(sum(${workoutSets.weightKg} * ${workoutSets.reps}) filter (where ${workingCompleted}), 0)::float8`,
      exerciseCount: sql<number>`count(distinct ${exerciseSessions.id}) filter (where ${workingCompleted})::int`,
    })
    .from(workoutSessions)
    .leftJoin(exerciseSessions, eq(exerciseSessions.sessionId, workoutSessions.id))
    .leftJoin(workoutSets, eq(workoutSets.exerciseSessionId, exerciseSessions.id))
    .where(and(eq(workoutSessions.userId, userId), ne(workoutSessions.status, "in_progress")))
    .groupBy(workoutSessions.id)
    .orderBy(desc(workoutSessions.startedAt))
    .limit(limit);

  return rows.map((row) => ({
    ...row,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    totalVolumeKg: Math.round(row.totalVolumeKg * 10) / 10,
  }));
}

export async function countCompletedSessions(userId: string, startDate: string, endDate: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, userId),
        eq(workoutSessions.status, "completed"),
        gte(workoutSessions.localDate, startDate),
        lte(workoutSessions.localDate, endDate),
      ),
    );
  return row?.count ?? 0;
}

/** Every active plan day with its exercises (names, photos, targets). Small: a week is at most a few dozen rows. */
export async function listWeekPlan(userId: string): Promise<PlanDayDetail[]> {
  const days = await listActivePlanDays(userId);
  if (days.length === 0) return [];

  const rows = await db
    .select({
      dayId: workoutDayExercises.workoutDayId,
      exerciseId: exercises.id,
      name: exercises.name,
      imageUrl: exercises.imageUrl,
      primaryMuscle: exercises.primaryMuscle,
      equipment: exercises.equipment,
      sets: workoutDayExercises.targetSets,
      repMin: workoutDayExercises.repMin,
      repMax: workoutDayExercises.repMax,
      rirMin: workoutDayExercises.targetRirMin,
      rirMax: workoutDayExercises.targetRirMax,
      allowFailureOnLastSet: workoutDayExercises.allowFailureOnLastSet,
    })
    .from(workoutDayExercises)
    .innerJoin(exercises, eq(exercises.id, workoutDayExercises.exerciseId))
    .where(inArray(workoutDayExercises.workoutDayId, days.map((d) => d.id)))
    .orderBy(asc(workoutDayExercises.workoutDayId), asc(workoutDayExercises.position));

  return days.map((day) => ({
    ...day,
    items: rows
      .filter((row) => row.dayId === day.id)
      .map(
        (row): DayPreviewItem => ({
          exerciseId: row.exerciseId,
          name: row.name,
          imageUrl: row.imageUrl,
          primaryMuscle: row.primaryMuscle,
          equipment: row.equipment,
          sets: row.sets,
          repMin: row.repMin,
          repMax: row.repMax,
          rirMin: row.rirMin,
          rirMax: row.rirMax,
          allowFailureOnLastSet: row.allowFailureOnLastSet,
        }),
      ),
  }));
}

/**
 * Best weight and best estimated 1RM per exercise from finished sessions (optionally excluding one).
 * The estimate matches the Epley formula in the exercises domain (single reps count at face value).
 */
export async function getExerciseBests(
  userId: string,
  exerciseIds: readonly string[],
  excludeSessionId?: string,
): Promise<Map<string, ExerciseBests>> {
  const result = new Map<string, ExerciseBests>();
  if (exerciseIds.length === 0) return result;

  const rows = await db
    .select({
      exerciseId: exerciseSessions.exerciseId,
      maxWeight: sql<string | null>`max(${workoutSets.weightKg})`,
      bestE1Rm: sql<string | null>`max(case when ${workoutSets.reps} = 1 then ${workoutSets.weightKg} else round(${workoutSets.weightKg} * (1 + ${workoutSets.reps}::numeric / 30.0), 1) end) filter (where ${workoutSets.reps} between 1 and 12)`,
    })
    .from(workoutSets)
    .innerJoin(exerciseSessions, eq(exerciseSessions.id, workoutSets.exerciseSessionId))
    .innerJoin(workoutSessions, eq(workoutSessions.id, exerciseSessions.sessionId))
    .where(
      and(
        eq(workoutSessions.userId, userId),
        ne(workoutSessions.status, "in_progress"),
        excludeSessionId ? ne(workoutSessions.id, excludeSessionId) : undefined,
        inArray(exerciseSessions.exerciseId, [...exerciseIds]),
        eq(workoutSets.completed, true),
        eq(workoutSets.isWarmup, false),
        sql`${workoutSets.weightKg} > 0`,
      ),
    )
    .groupBy(exerciseSessions.exerciseId);

  for (const row of rows) {
    if (!row.exerciseId) continue;
    result.set(row.exerciseId, { maxWeightKg: toNumber(row.maxWeight), bestE1RmKg: toNumber(row.bestE1Rm) });
  }
  return result;
}

export interface PlanItemWrite {
  exerciseId: string;
  targetSets: number;
  repMin: number;
  repMax: number;
  targetRirMin: number;
  targetRirMax: number;
  allowFailureOnLastSet: boolean;
}

/**
 * Replaces the exercises of one plan day atomically, in the given order. Past sessions are unaffected:
 * they hold their own snapshots and never reference these rows.
 */
export async function replaceDayItems(dayId: string, items: readonly PlanItemWrite[]): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(workoutDayExercises).where(eq(workoutDayExercises.workoutDayId, dayId));
    if (items.length === 0) return;
    await tx.insert(workoutDayExercises).values(
      items.map((item, position) => ({
        workoutDayId: dayId,
        exerciseId: item.exerciseId,
        position,
        targetSets: item.targetSets,
        repMin: item.repMin,
        repMax: item.repMax,
        targetRirMin: item.targetRirMin,
        targetRirMax: item.targetRirMax,
        allowFailureOnLastSet: item.allowFailureOnLastSet,
      })),
    );
  });
}
