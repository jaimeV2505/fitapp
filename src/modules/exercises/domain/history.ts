import type { ExerciseHistoryPoint, ExerciseRecords, HistorySetRow } from "../types";

const MAX_REPS_FOR_ESTIMATE = 12;

/**
 * Epley one-rep-max estimate. Only meaningful for low/moderate rep sets, so high-rep sets
 * return null instead of a misleading number.
 */
export function estimate1Rm(weightKg: number | null, reps: number | null): number | null {
  if (weightKg === null || reps === null || weightKg <= 0 || reps <= 0 || reps > MAX_REPS_FOR_ESTIMATE) return null;
  if (reps === 1) return round1(weightKg);
  return round1(weightKg * (1 + reps / 30));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Groups completed working sets by session and keeps the most recent `maxSessions`.
 * `rows` must be ordered newest first. The result is chronological (oldest first) for charting.
 */
export function buildExerciseHistory(rows: readonly HistorySetRow[], maxSessions: number): ExerciseHistoryPoint[] {
  const order: string[] = [];
  const bySession = new Map<string, HistorySetRow[]>();
  for (const row of rows) {
    let list = bySession.get(row.sessionId);
    if (!list) {
      if (order.length >= maxSessions) continue;
      list = [];
      bySession.set(row.sessionId, list);
      order.push(row.sessionId);
    }
    list.push(row);
  }

  const points = order.map((sessionId): ExerciseHistoryPoint => {
    const sets = bySession.get(sessionId) ?? [];
    const weights = sets.map((s) => s.weightKg).filter((w): w is number => w !== null);
    const topWeightKg = weights.length > 0 ? Math.max(...weights) : null;
    const topSets = sets.filter((s) => s.weightKg === topWeightKg);
    const repsAtTopWeight = topSets.reduce<number | null>(
      (best, s) => (s.reps !== null && (best === null || s.reps > best) ? s.reps : best),
      null,
    );
    const volume = sets.reduce((sum, s) => sum + (s.weightKg !== null && s.reps !== null ? s.weightKg * s.reps : 0), 0);
    const estimates = sets.map((s) => estimate1Rm(s.weightKg, s.reps)).filter((e): e is number => e !== null);

    return {
      sessionId,
      localDate: sets[0]?.localDate ?? "",
      sets: sets.length,
      topWeightKg,
      repsAtTopWeight,
      totalVolumeKg: round1(volume),
      estimated1RmKg: estimates.length > 0 ? Math.max(...estimates) : null,
    };
  });

  return points.reverse();
}

export function computeRecords(points: readonly ExerciseHistoryPoint[]): ExerciseRecords {
  const max = (values: (number | null)[]): number | null => {
    const defined = values.filter((v): v is number => v !== null);
    return defined.length > 0 ? Math.max(...defined) : null;
  };
  return {
    maxWeightKg: max(points.map((p) => p.topWeightKg)),
    bestEstimated1RmKg: max(points.map((p) => p.estimated1RmKg)),
    bestSessionVolumeKg: max(points.map((p) => (p.totalVolumeKg > 0 ? p.totalVolumeKg : null))),
  };
}
