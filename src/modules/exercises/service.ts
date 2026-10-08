import { AppError } from "@/lib/errors";
import { buildExerciseHistory, computeRecords } from "./domain/history";
import type { MuscleGroup } from "@/lib/db/schema/enums";
import { customSlugExists, findVisibleExercise, insertCustomExercise, listHistorySets, searchExercises } from "./repository";
import type { CreateExerciseInput } from "./validators";
import type { ExerciseDetail, ExerciseListItem } from "./types";

const HISTORY_SESSIONS = 12;

export async function getExerciseDetail(userId: string, exerciseId: string): Promise<ExerciseDetail> {
  const exercise = await findVisibleExercise(userId, exerciseId);
  if (!exercise) throw new AppError("not_found", "This exercise no longer exists.");

  const history = buildExerciseHistory(await listHistorySets(userId, exerciseId), HISTORY_SESSIONS);
  return {
    id: exercise.id,
    name: exercise.name,
    primaryMuscle: exercise.primaryMuscle,
    secondaryMuscles: exercise.secondaryMuscles,
    equipment: exercise.equipment,
    imageUrls: exercise.imageUrls,
    instructions: (exercise.instructions ?? "")
      .split("\n")
      .map((step) => step.trim())
      .filter((step) => step !== ""),
    history,
    records: computeRecords(history),
  };
}

export async function browseExercises(userId: string, filters: { query?: string; muscle?: MuscleGroup }): Promise<ExerciseListItem[]> {
  return searchExercises(userId, filters);
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base === "" ? "exercise" : base;
}

/** Your own exercise, usable in your routine immediately (no photo until you add one). */
export async function createCustomExercise(userId: string, input: CreateExerciseInput): Promise<ExerciseListItem> {
  const base = slugify(input.name);
  let slug = base;
  for (let attempt = 2; await customSlugExists(userId, slug); attempt += 1) slug = `${base}-${attempt}`;
  return insertCustomExercise({
    userId,
    slug,
    name: input.name,
    primaryMuscle: input.primaryMuscle,
    equipment: input.equipment ?? null,
    movementType: input.movementType,
  });
}
