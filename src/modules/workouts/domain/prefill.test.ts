import { describe, expect, it } from "vitest";
import type { ExerciseSessionView, SetView } from "../types";
import { findActiveExerciseId, findActiveSet, prefillDraft } from "./prefill";

const makeSet = (setNumber: number, overrides: Partial<SetView> = {}): SetView => ({
  id: `set-${setNumber}`,
  setNumber,
  isWarmup: false,
  weightKg: null,
  reps: null,
  rir: null,
  completed: false,
  completedAt: null,
  ...overrides,
});

const makeExercise = (overrides: Partial<ExerciseSessionView> = {}): ExerciseSessionView => ({
  id: "es-1",
  exerciseId: "ex-1",
  name: "Incline Press",
  primaryMuscle: "chest",
  secondaryMuscles: [],
  imageUrls: [],
  bests: null,
  equipment: null,
  position: 0,
  targetSets: 3,
  repMin: 6,
  repMax: 8,
  rirMin: 1,
  rirMax: 2,
  allowFailureOnLastSet: false,
  restSeconds: 120,
  sets: [makeSet(1), makeSet(2), makeSet(3)],
  previous: {
    localDate: "2026-10-05",
    sets: [
      { weightKg: 30, reps: 8, rir: null },
      { weightKg: 30, reps: 7, rir: null },
      { weightKg: 28, reps: 6, rir: null },
    ],
  },
  ...overrides,
});

describe("prefillDraft", () => {
  it("uses the same set number from last time on the first set", () => {
    const exercise = makeExercise();
    expect(prefillDraft(exercise, exercise.sets[0]!)).toEqual({ weightKg: 30, reps: 8, rir: 2 });
  });

  it("prefers the weight and RIR just logged in this session", () => {
    const exercise = makeExercise({
      sets: [makeSet(1, { completed: true, weightKg: 32, reps: 8, rir: 1 }), makeSet(2), makeSet(3)],
    });
    expect(prefillDraft(exercise, exercise.sets[1]!)).toEqual({ weightKg: 32, reps: 7, rir: 1 });
  });

  it("falls back to the top of the target range when there is no history", () => {
    const exercise = makeExercise({ previous: null });
    expect(prefillDraft(exercise, exercise.sets[0]!)).toEqual({ weightKg: null, reps: 8, rir: 2 });
  });

  it("returns the stored values for an already completed set", () => {
    const done = makeSet(1, { completed: true, weightKg: 34, reps: 6, rir: 0 });
    expect(prefillDraft(makeExercise({ sets: [done] }), done)).toEqual({ weightKg: 34, reps: 6, rir: 0 });
  });
});

describe("active set and exercise", () => {
  it("finds the first incomplete working set", () => {
    const exercise = makeExercise({ sets: [makeSet(1, { completed: true }), makeSet(2), makeSet(3)] });
    expect(findActiveSet(exercise)?.setNumber).toBe(2);
  });

  it("finds the first exercise that still has work left", () => {
    const done = makeExercise({ id: "a", sets: [makeSet(1, { completed: true })] });
    const open = makeExercise({ id: "b" });
    expect(findActiveExerciseId([done, open])).toBe("b");
    expect(findActiveExerciseId([done])).toBeNull();
  });
});
