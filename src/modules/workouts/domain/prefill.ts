import type { Equipment } from "@/lib/db/schema/enums";
import type { ExerciseSessionView, SetView } from "../types";

export interface SetDraft {
  weightKg: number | null;
  reps: number | null;
  rir: number | null;
}

/**
 * Chooses the starting values shown in the set editor, so the common case is one tap.
 * Priority for weight: last completed set in this session, then the same set number last time,
 * then the heaviest set last time. Reps: the same set number last time, else the top of the target range.
 * RIR: last RIR logged in this session, else the top of the target RIR range.
 */
export function prefillDraft(exercise: ExerciseSessionView, set: SetView): SetDraft {
  if (set.completed) return { weightKg: set.weightKg, reps: set.reps, rir: set.rir };

  const completedHere = exercise.sets.filter((s) => s.completed && !s.isWarmup);
  const lastHere = completedHere[completedHere.length - 1];
  const previousSets = exercise.previous?.sets ?? [];
  const previousSame = previousSets[set.setNumber - 1];
  const previousWeights = previousSets.map((s) => s.weightKg).filter((w): w is number => w !== null);
  const previousTop = previousWeights.length > 0 ? Math.max(...previousWeights) : null;

  return {
    weightKg: set.weightKg ?? lastHere?.weightKg ?? previousSame?.weightKg ?? previousTop,
    reps: set.reps ?? previousSame?.reps ?? exercise.repMax,
    rir: set.rir ?? lastHere?.rir ?? exercise.rirMax,
  };
}

/** The set the lifter should do next: the first incomplete working set. */
export function findActiveSet(exercise: ExerciseSessionView): SetView | null {
  return exercise.sets.find((s) => !s.completed && !s.isWarmup) ?? null;
}

/** The exercise to focus next: the first exercise that still has an incomplete working set. */
export function findActiveExerciseId(exercises: readonly ExerciseSessionView[]): string | null {
  return exercises.find((e) => findActiveSet(e) !== null)?.id ?? null;
}

/** Sensible +/- jump for the weight stepper. Plate and stack increments differ by equipment. */
export function weightStepFor(equipment: Equipment | null): number {
  switch (equipment) {
    case "dumbbell":
      return 2;
    case "machine":
      return 5;
    default:
      return 2.5;
  }
}
