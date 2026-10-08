import type { ExerciseSessionView, SaveSetInput, SessionView, SetView } from "../types";

/** Pure state transitions for the live workout logger. Kept outside React so they are easy to test. */

export function applySaveSet(session: SessionView, input: SaveSetInput): SessionView {
  let changed = false;
  const exercises = session.exercises.map((exercise) => {
    if (!exercise.sets.some((s) => s.id === input.setId)) return exercise;
    changed = true;
    return {
      ...exercise,
      sets: exercise.sets.map((set) =>
        set.id === input.setId
          ? {
              ...set,
              weightKg: input.weightKg,
              reps: input.reps,
              rir: input.rir,
              completed: input.completed,
              completedAt: input.completed ? input.completedAt : null,
            }
          : set,
      ),
    };
  });
  return changed ? { ...session, exercises } : session;
}

export function applySaveSets(session: SessionView, inputs: readonly SaveSetInput[]): SessionView {
  return inputs.reduce(applySaveSet, session);
}

export function applyAddSet(session: SessionView, exerciseSessionId: string, set: SetView): SessionView {
  return mapExercise(session, exerciseSessionId, (exercise) =>
    exercise.sets.some((s) => s.id === set.id) ? exercise : { ...exercise, sets: [...exercise.sets, set] },
  );
}

export function applyRemoveSet(session: SessionView, setId: string): SessionView {
  return {
    ...session,
    exercises: session.exercises.map((exercise) =>
      exercise.sets.some((s) => s.id === setId)
        ? { ...exercise, sets: exercise.sets.filter((s) => s.id !== setId) }
        : exercise,
    ),
  };
}

function mapExercise(
  session: SessionView,
  exerciseSessionId: string,
  update: (exercise: ExerciseSessionView) => ExerciseSessionView,
): SessionView {
  return {
    ...session,
    exercises: session.exercises.map((exercise) => (exercise.id === exerciseSessionId ? update(exercise) : exercise)),
  };
}
