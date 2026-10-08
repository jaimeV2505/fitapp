import { describe, expect, it } from "vitest";
import { computeSessionProgress, isExerciseComplete, setVolumeKg } from "./metrics";

const set = (completed: boolean, weightKg: number | null, reps: number | null, isWarmup = false) => ({
  completed,
  weightKg,
  reps,
  isWarmup,
});

describe("setVolumeKg", () => {
  it("multiplies weight by reps and treats missing values as zero", () => {
    expect(setVolumeKg({ weightKg: 32, reps: 8 })).toBe(256);
    expect(setVolumeKg({ weightKg: null, reps: 8 })).toBe(0);
  });
});

describe("isExerciseComplete", () => {
  it("requires every working set to be completed", () => {
    expect(isExerciseComplete({ sets: [set(true, 30, 8), set(false, null, null)] })).toBe(false);
    expect(isExerciseComplete({ sets: [set(true, 30, 8), set(true, 30, 7)] })).toBe(true);
  });

  it("ignores warm-up sets", () => {
    expect(isExerciseComplete({ sets: [set(false, 20, 10, true), set(true, 30, 8)] })).toBe(true);
  });

  it("is false for an exercise with no sets", () => {
    expect(isExerciseComplete({ sets: [] })).toBe(false);
  });
});

describe("computeSessionProgress", () => {
  it("counts exercises, sets, percent and volume from completed working sets only", () => {
    const progress = computeSessionProgress([
      { sets: [set(true, 32, 8), set(true, 32, 8), set(true, 32, 7), set(true, 32, 6)] },
      { sets: [set(true, 50, 10), set(false, null, null), set(false, null, null)] },
      { sets: [set(false, null, null, false)] },
    ]);
    expect(progress.exercisesCompleted).toBe(1);
    expect(progress.exercisesTotal).toBe(3);
    expect(progress.setsCompleted).toBe(5);
    expect(progress.setsTotal).toBe(8);
    expect(progress.percent).toBe(63);
    expect(progress.totalVolumeKg).toBe(32 * 8 + 32 * 8 + 32 * 7 + 32 * 6 + 500);
  });

  it("returns zero percent for an empty session", () => {
    expect(computeSessionProgress([]).percent).toBe(0);
  });
});
