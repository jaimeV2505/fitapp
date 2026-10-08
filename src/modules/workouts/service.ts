import { AppError } from "@/lib/errors";
import { isUniqueViolation } from "@/lib/db/errors";
import { localDateString, isoWeekday, weekRange } from "@/lib/time";
import { getUserSettings, type UserSettingsView } from "@/modules/settings/repository";
import { listVisibleExerciseBasics } from "@/modules/exercises/repository";
import { buildExerciseBlueprints } from "./domain/blueprint";
import { intensityFor } from "./domain/intensity";
import { computeSessionProgress, countsAsWorkingSet } from "./domain/metrics";
import { findSessionRecords } from "./domain/records";
import {
  appendSet,
  countCompletedSessions,
  deleteExtraSet,
  findActiveSession,
  findLastSetActivity,
  findPlanDay,
  getExerciseBests,
  getSessionView,
  insertSessionFromBlueprint,
  listActivePlanDays,
  listPlanItems,
  listSessionSummaries,
  listWeekPlan,
  markSessionFinished,
  replaceDayItems,
  updateSet,
} from "./repository";
import { insertRecords, listRecentRecords, listRecordsForSession, type NewRecordRow, type StoredRecord } from "./records-repository";
import type { SavePlanDayInput } from "./validators";
import type { PlanDayDetail, PlanDayOverview, RecordSummary, SaveSetInput, SessionSummary, SessionView, SetView } from "./types";

/** A session left open longer than this is closed automatically when a new workout starts. */
const STALE_SESSION_MS = 18 * 60 * 60 * 1000;
/** Device clocks may drift; reject completion times further in the future than this. */
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;

/* ---------- start / resume ---------- */

export async function startWorkout(
  userId: string,
  dayId: string,
  now: Date = new Date(),
): Promise<{ sessionId: string; resumed: boolean }> {
  const active = await findActiveSession(userId);
  if (active) {
    if (now.getTime() - active.startedAt.getTime() <= STALE_SESSION_MS) {
      return { sessionId: active.id, resumed: true };
    }
    const lastActivity = await findLastSetActivity(active.id);
    await markSessionFinished(userId, active.id, "completed", lastActivity ?? active.startedAt);
  }

  const day = await findPlanDay(userId, dayId);
  if (!day) throw new AppError("not_found", "That workout day no longer exists.");

  const [settings, items] = await Promise.all([getUserSettings(userId), listPlanItems(userId, dayId)]);
  if (items.length === 0) throw new AppError("validation", "This workout day has no exercises yet.");

  const exercises = buildExerciseBlueprints(items, settings.defaultRestSeconds);

  try {
    const sessionId = await insertSessionFromBlueprint({
      userId,
      planId: day.planId,
      dayId: day.id,
      name: day.name,
      focus: day.focus,
      localDate: localDateString(now, settings.timezone),
      startedAt: now,
      exercises,
    });
    return { sessionId, resumed: false };
  } catch (error) {
    // Double tap: another request created the session first. Resume it.
    if (isUniqueViolation(error)) {
      const winner = await findActiveSession(userId);
      if (winner) return { sessionId: winner.id, resumed: true };
    }
    throw error;
  }
}

/* ---------- reading ---------- */

export async function getSession(userId: string, sessionId: string): Promise<SessionView | null> {
  return getSessionView(userId, sessionId);
}

export interface WorkoutHub {
  settings: UserSettingsView;
  days: PlanDayOverview[];
  todayDay: PlanDayOverview | null;
  activeSessionId: string | null;
  todayIsoWeekday: number;
  localDate: string;
}

export async function getWorkoutHub(userId: string, now: Date = new Date()): Promise<WorkoutHub> {
  const [settings, days, active] = await Promise.all([
    getUserSettings(userId),
    listActivePlanDays(userId),
    findActiveSession(userId),
  ]);
  const todayIsoWeekday = isoWeekday(now, settings.timezone);
  return {
    settings,
    days,
    todayDay: days.find((day) => day.weekday === todayIsoWeekday) ?? null,
    activeSessionId: active?.id ?? null,
    todayIsoWeekday,
    localDate: localDateString(now, settings.timezone),
  };
}

export interface WeekProgress {
  completed: number;
  target: number;
}

export async function getWeekProgress(userId: string, now: Date = new Date()): Promise<WeekProgress> {
  const settings = await getUserSettings(userId);
  const { start, end } = weekRange(localDateString(now, settings.timezone), settings.weekStartsOn);
  return { completed: await countCompletedSessions(userId, start, end), target: settings.weeklyWorkoutTarget };
}

export async function listHistory(userId: string, limit = 50): Promise<SessionSummary[]> {
  return listSessionSummaries(userId, limit);
}

export async function findActiveSessionId(userId: string): Promise<string | null> {
  return (await findActiveSession(userId))?.id ?? null;
}

/* ---------- set logging ---------- */

function clampCompletedAt(value: string | null, now: Date): string | null {
  if (value === null) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return now.toISOString();
  return parsed.getTime() > now.getTime() + MAX_FUTURE_SKEW_MS ? now.toISOString() : parsed.toISOString();
}

/** Idempotent: saving the same set state twice has the same result, so retries are safe. */
export async function saveSet(userId: string, input: SaveSetInput, now: Date = new Date()): Promise<SetView> {
  const saved = await updateSet(userId, { ...input, completedAt: input.completed ? clampCompletedAt(input.completedAt, now) ?? now.toISOString() : null });
  if (!saved) throw new AppError("not_found", "This set can no longer be edited.");
  return saved;
}

export async function addExtraSet(userId: string, exerciseSessionId: string): Promise<SetView> {
  try {
    const created = await appendSet(userId, exerciseSessionId);
    if (!created) throw new AppError("not_found", "This exercise can no longer be edited.");
    return created;
  } catch (error) {
    if (isUniqueViolation(error)) throw new AppError("conflict", "Another set was added at the same time. Try again.");
    throw error;
  }
}

export async function removeExtraSet(userId: string, setId: string): Promise<void> {
  const removed = await deleteExtraSet(userId, setId);
  if (!removed) throw new AppError("conflict", "Only extra sets that are not completed can be removed.");
}

/* ---------- finishing ---------- */

export interface FinishResult {
  sessionId: string;
  setsCompleted: number;
  exercisesCompleted: number;
  totalVolumeKg: number;
  recordsCount: number;
}

export async function finishWorkout(userId: string, sessionId: string, now: Date = new Date()): Promise<FinishResult> {
  const closed = await markSessionFinished(userId, sessionId, "completed", now);
  if (!closed) throw new AppError("not_found", "This workout is already finished or no longer exists.");

  const view = await getSessionView(userId, sessionId);
  const progress = computeSessionProgress(view?.exercises ?? []);
  const recordsCount = view ? await saveSessionRecords(userId, view, now) : 0;
  return {
    sessionId,
    setsCompleted: progress.setsCompleted,
    exercisesCompleted: progress.exercisesCompleted,
    totalVolumeKg: progress.totalVolumeKg,
    recordsCount,
  };
}

/**
 * Stores the personal records set in a finished session. They are measured against everything done
 * in earlier sessions; an exercise with no earlier history has nothing to beat, so it sets none.
 */
async function saveSessionRecords(userId: string, view: SessionView, now: Date): Promise<number> {
  const exerciseIds = view.exercises.flatMap((e) => (e.exerciseId ? [e.exerciseId] : []));
  const baselines = await getExerciseBests(userId, exerciseIds, view.id);

  const rows: NewRecordRow[] = [];
  for (const exercise of view.exercises) {
    if (!exercise.exerciseId) continue;
    const done = exercise.sets.filter(countsAsWorkingSet);
    const hits = findSessionRecords(baselines.get(exercise.exerciseId) ?? null, done);
    for (const hit of hits) {
      const source = done.find((set) => set.weightKg === hit.weightKg && set.reps === hit.reps);
      rows.push({
        userId,
        kind: hit.kind,
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.name,
        valueKg: hit.valueKg,
        achievedAt: source?.completedAt ? new Date(source.completedAt) : now,
        sourceSetId: source?.id ?? null,
      });
    }
  }
  await insertRecords(rows);
  return rows.length;
}

export async function abandonWorkout(userId: string, sessionId: string, now: Date = new Date()): Promise<void> {
  const closed = await markSessionFinished(userId, sessionId, "abandoned", now);
  if (!closed) throw new AppError("not_found", "This workout is already finished or no longer exists.");
}

export interface WeekPlanView {
  days: PlanDayDetail[];
  todayDayId: string | null;
  activeSessionId: string | null;
}

/** The whole routine (Monday to Friday) plus which day matches today, for the day picker. */
export async function getWeekPlan(userId: string, now: Date = new Date()): Promise<WeekPlanView> {
  const [settings, days, active] = await Promise.all([getUserSettings(userId), listWeekPlan(userId), findActiveSession(userId)]);
  const weekday = isoWeekday(now, settings.timezone);
  return {
    days,
    todayDayId: days.find((day) => day.weekday === weekday)?.id ?? null,
    activeSessionId: active?.id ?? null,
  };
}

async function toSummaries(userId: string, records: StoredRecord[]): Promise<RecordSummary[]> {
  if (records.length === 0) return [];
  const { timezone } = await getUserSettings(userId);
  return records.map((r) => ({
    id: r.id,
    kind: r.kind,
    exerciseName: r.exerciseName,
    valueKg: r.valueKg,
    localDate: localDateString(r.achievedAt, timezone),
  }));
}

export async function getSessionRecords(userId: string, sessionId: string): Promise<RecordSummary[]> {
  return toSummaries(userId, await listRecordsForSession(userId, sessionId));
}

export async function getRecentRecords(userId: string, limit = 8): Promise<RecordSummary[]> {
  return toSummaries(userId, await listRecentRecords(userId, limit));
}

/** Saves the edited exercise list of one plan day (add, swap, reorder, change targets). */
export async function savePlanDay(userId: string, input: SavePlanDayInput): Promise<{ count: number }> {
  const day = await findPlanDay(userId, input.dayId);
  if (!day) throw new AppError("not_found", "That workout day no longer exists.");

  const basics = await listVisibleExerciseBasics(userId, [...new Set(input.items.map((i) => i.exerciseId))]);
  const rows = input.items.map((item) => {
    const exercise = basics.get(item.exerciseId);
    if (!exercise) throw new AppError("not_found", "One of the exercises is no longer available. Pick it again.");
    const derived = intensityFor(exercise);
    const rirMin = item.rirMin ?? derived.targetRirMin;
    const rirMax = Math.max(rirMin, item.rirMax ?? derived.targetRirMax);
    return {
      exerciseId: item.exerciseId,
      targetSets: item.sets,
      repMin: item.repMin,
      repMax: item.repMax,
      targetRirMin: rirMin,
      targetRirMax: rirMax,
      allowFailureOnLastSet: item.allowFailureOnLastSet ?? derived.allowFailureOnLastSet,
    };
  });

  await replaceDayItems(day.id, rows);
  return { count: rows.length };
}
