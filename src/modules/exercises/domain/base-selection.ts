import { MUSCLE_GROUPS, type MuscleGroup } from "@/lib/db/schema/enums";
import type { BaseExercise } from "@/data/starter/base-exercises";

/** Every muscle group should offer at least this many built-in exercises in the picker. */
export const MIN_PER_MUSCLE = 20;

export interface ExistingExercise {
  slug: string;
  name: string;
  primaryMuscle: MuscleGroup;
  archived?: boolean;
}

/** "Incline Dumbbell Press" and "incline dumbbell press!" are the same exercise. */
export function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * Which of the reserve exercises to add so that every muscle has at least `min` built-in exercises.
 * Only tops up what is missing, in the order of the reserve (best known first), and never adds an exercise whose
 * slug or normalised name already exists, so a library that already covers a muscle adds nothing for it.
 */
export function selectBaseExercises(reserve: readonly BaseExercise[], existing: readonly ExistingExercise[], min = MIN_PER_MUSCLE): BaseExercise[] {
  const counts = new Map<MuscleGroup, number>(MUSCLE_GROUPS.map((muscle) => [muscle, 0]));
  const slugs = new Set<string>();
  const names = new Set<string>();
  for (const exercise of existing) {
    slugs.add(exercise.slug);
    names.add(normalizeName(exercise.name));
    if (!exercise.archived) counts.set(exercise.primaryMuscle, (counts.get(exercise.primaryMuscle) ?? 0) + 1);
  }

  const chosen: BaseExercise[] = [];
  for (const candidate of reserve) {
    if ((counts.get(candidate.primaryMuscle) ?? 0) >= min) continue;
    if (slugs.has(candidate.slug) || names.has(normalizeName(candidate.name))) continue;
    chosen.push(candidate);
    slugs.add(candidate.slug);
    names.add(normalizeName(candidate.name));
    counts.set(candidate.primaryMuscle, (counts.get(candidate.primaryMuscle) ?? 0) + 1);
  }
  return chosen;
}
