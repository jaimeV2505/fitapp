import { estimate1Rm } from "@/modules/exercises/domain/history";

export interface SetResult {
  weightKg: number | null;
  reps: number | null;
}

/** Best numbers ever achieved on an exercise before the current session. */
export interface ExerciseBests {
  maxWeightKg: number | null;
  bestE1RmKg: number | null;
}

export type RecordKind = "weight" | "e1rm";

export interface RecordHit {
  kind: RecordKind;
  /** The record value in kg (the weight, or the estimated 1RM). */
  valueKg: number;
  weightKg: number;
  reps: number;
}

const valid = (set: SetResult): set is { weightKg: number; reps: number } =>
  set.weightKg !== null && set.reps !== null && set.weightKg > 0 && set.reps > 0;

export function bestsOf(sets: readonly SetResult[]): ExerciseBests {
  let maxWeightKg: number | null = null;
  let bestE1RmKg: number | null = null;
  for (const set of sets) {
    if (!valid(set)) continue;
    if (maxWeightKg === null || set.weightKg > maxWeightKg) maxWeightKg = set.weightKg;
    const estimate = estimate1Rm(set.weightKg, set.reps);
    if (estimate !== null && (bestE1RmKg === null || estimate > bestE1RmKg)) bestE1RmKg = estimate;
  }
  return { maxWeightKg, bestE1RmKg };
}

function mergeBests(a: ExerciseBests, b: ExerciseBests): ExerciseBests {
  const max = (x: number | null, y: number | null): number | null => (x === null ? y : y === null ? x : Math.max(x, y));
  return { maxWeightKg: max(a.maxWeightKg, b.maxWeightKg), bestE1RmKg: max(a.bestE1RmKg, b.bestE1RmKg) };
}

/**
 * Is this set a new personal record? Compared with everything before the session plus the sets
 * already done today, so each improvement is celebrated once. With no earlier history there is
 * nothing to beat, so the very first session never fires a record.
 */
export function evaluateSet(baseline: ExerciseBests | null, earlierThisSession: readonly SetResult[], candidate: SetResult): RecordHit | null {
  if (baseline === null || !valid(candidate)) return null;
  const running = mergeBests(baseline, bestsOf(earlierThisSession));

  if (running.maxWeightKg !== null && candidate.weightKg > running.maxWeightKg) {
    return { kind: "weight", valueKg: candidate.weightKg, weightKg: candidate.weightKg, reps: candidate.reps };
  }
  const estimate = estimate1Rm(candidate.weightKg, candidate.reps);
  if (estimate !== null && running.bestE1RmKg !== null && estimate > running.bestE1RmKg) {
    return { kind: "e1rm", valueKg: estimate, weightKg: candidate.weightKg, reps: candidate.reps };
  }
  return null;
}

/** Records set during a finished session, for saving and for the summary. At most one per kind. */
export function findSessionRecords(baseline: ExerciseBests | null, sets: readonly SetResult[]): RecordHit[] {
  if (baseline === null) return [];
  const hits: RecordHit[] = [];

  let bestWeight: { weightKg: number; reps: number } | null = null;
  let bestE1: { weightKg: number; reps: number; value: number } | null = null;
  for (const set of sets) {
    if (!valid(set)) continue;
    if (bestWeight === null || set.weightKg > bestWeight.weightKg || (set.weightKg === bestWeight.weightKg && set.reps > bestWeight.reps)) {
      bestWeight = set;
    }
    const estimate = estimate1Rm(set.weightKg, set.reps);
    if (estimate !== null && (bestE1 === null || estimate > bestE1.value)) bestE1 = { ...set, value: estimate };
  }

  if (bestWeight && baseline.maxWeightKg !== null && bestWeight.weightKg > baseline.maxWeightKg) {
    hits.push({ kind: "weight", valueKg: bestWeight.weightKg, weightKg: bestWeight.weightKg, reps: bestWeight.reps });
  }
  if (bestE1 && baseline.bestE1RmKg !== null && bestE1.value > baseline.bestE1RmKg) {
    hits.push({ kind: "e1rm", valueKg: bestE1.value, weightKg: bestE1.weightKg, reps: bestE1.reps });
  }
  return hits;
}
