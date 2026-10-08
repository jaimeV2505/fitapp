import { describe, expect, it } from "vitest";
import { buildExerciseBlueprints, type PlanItemInput } from "./blueprint";

const item = (overrides: Partial<PlanItemInput> = {}): PlanItemInput => ({
  exerciseId: "ex-1",
  exerciseName: "Incline Press",
  primaryMuscle: "chest",
  secondaryMuscles: ["shoulders", "triceps"],
  equipment: null,
  position: 0,
  targetSets: 4,
  repMin: 6,
  repMax: 8,
  targetRirMin: 1,
  targetRirMax: 2,
  allowFailureOnLastSet: false,
  restSeconds: null,
  ...overrides,
});

describe("buildExerciseBlueprints", () => {
  it("creates one set row per target set with the rep range copied onto each", () => {
    const [first] = buildExerciseBlueprints([item()], 120);
    expect(first?.sets).toHaveLength(4);
    expect(first?.sets.map((s) => s.setNumber)).toEqual([1, 2, 3, 4]);
    expect(first?.sets.every((s) => s.targetRepMin === 6 && s.targetRepMax === 8)).toBe(true);
  });

  it("snapshots names and muscles so later plan edits cannot change history", () => {
    const input = item();
    const [first] = buildExerciseBlueprints([input], 120);
    input.secondaryMuscles.push("core");
    expect(first?.nameSnapshot).toBe("Incline Press");
    expect(first?.secondaryMusclesSnapshot).toEqual(["shoulders", "triceps"]);
  });

  it("falls back to the default rest time and honours an override", () => {
    const [a, b] = buildExerciseBlueprints([item({ position: 0 }), item({ position: 1, restSeconds: 60 })], 150);
    expect(a?.restSeconds).toBe(150);
    expect(b?.restSeconds).toBe(60);
  });

  it("orders by plan position and renumbers positions from zero", () => {
    const result = buildExerciseBlueprints(
      [item({ exerciseId: "b", position: 5 }), item({ exerciseId: "a", position: 2 })],
      120,
    );
    expect(result.map((r) => r.exerciseId)).toEqual(["a", "b"]);
    expect(result.map((r) => r.position)).toEqual([0, 1]);
  });
});
