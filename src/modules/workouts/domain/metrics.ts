import type { SetView } from "../types";

export interface ExerciseProgressInput {
  sets: readonly Pick<SetView, "completed" | "isWarmup" | "weightKg" | "reps">[];
}

/** Volume of one set in kg: weight x reps. Bodyweight or unfilled sets count as 0. */
export function setVolumeKg(set: Pick<SetView, "weightKg" | "reps">): number {
  if (set.weightKg === null || set.reps === null) return 0;
  return set.weightKg * set.reps;
}

export function countsAsWorkingSet(set: Pick<SetView, "completed" | "isWarmup">): boolean {
  return set.completed && !set.isWarmup;
}

export function isExerciseComplete(exercise: ExerciseProgressInput): boolean {
  const working = exercise.sets.filter((s) => !s.isWarmup);
  return working.length > 0 && working.every((s) => s.completed);
}

export interface SessionProgress {
  exercisesCompleted: number;
  exercisesTotal: number;
  setsCompleted: number;
  setsTotal: number;
  /** Whole-number percentage of working sets completed (0-100). */
  percent: number;
  totalVolumeKg: number;
}

export function computeSessionProgress(exercises: readonly ExerciseProgressInput[]): SessionProgress {
  let setsCompleted = 0;
  let setsTotal = 0;
  let totalVolumeKg = 0;
  let exercisesCompleted = 0;

  for (const exercise of exercises) {
    if (isExerciseComplete(exercise)) exercisesCompleted += 1;
    for (const set of exercise.sets) {
      if (set.isWarmup) continue;
      setsTotal += 1;
      if (countsAsWorkingSet(set)) {
        setsCompleted += 1;
        totalVolumeKg += setVolumeKg(set);
      }
    }
  }

  return {
    exercisesCompleted,
    exercisesTotal: exercises.length,
    setsCompleted,
    setsTotal,
    percent: setsTotal === 0 ? 0 : Math.round((setsCompleted / setsTotal) * 100),
    totalVolumeKg: Math.round(totalVolumeKg * 10) / 10,
  };
}
