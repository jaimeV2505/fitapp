import { describe, expect, it } from "vitest";
import type { SessionView } from "../types";
import { applyAddSet, applyRemoveSet, applySaveSet, applySaveSets } from "./logger-state";

const session = (): SessionView => ({
  id: "s1",
  name: "Push Heavy",
  focus: "Push",
  status: "in_progress",
  startedAt: "2026-10-08T10:00:00.000Z",
  completedAt: null,
  localDate: "2026-10-08",
  exercises: [
    {
      id: "es1",
      exerciseId: "e1",
      name: "Incline Press",
      primaryMuscle: "chest",
      secondaryMuscles: [],
      imageUrls: [],
  bests: null,
      equipment: null,
      position: 0,
      targetSets: 2,
      repMin: 6,
      repMax: 8,
      rirMin: 1,
      rirMax: 2,
      allowFailureOnLastSet: false,
      restSeconds: 120,
      previous: null,
      trend: [],
      sets: [
        { id: "a", setNumber: 1, isWarmup: false, weightKg: null, reps: null, rir: null, completed: false, completedAt: null },
        { id: "b", setNumber: 2, isWarmup: false, weightKg: null, reps: null, rir: null, completed: false, completedAt: null },
      ],
    },
  ],
});

describe("logger state", () => {
  it("completes a set without touching the others", () => {
    const next = applySaveSet(session(), {
      setId: "a",
      weightKg: 32,
      reps: 8,
      rir: 1,
      completed: true,
      completedAt: "2026-10-08T10:05:00.000Z",
    });
    const sets = next.exercises[0]!.sets;
    expect(sets[0]!.completed).toBe(true);
    expect(sets[0]!.weightKg).toBe(32);
    expect(sets[0]!.reps).toBe(8);
    expect(sets[0]!.rir).toBe(1);
    expect(sets[1]!.completed).toBe(false);
  });

  it("clears the completion time when a set is un-completed", () => {
    const done = applySaveSet(session(), { setId: "a", weightKg: 32, reps: 8, rir: 1, completed: true, completedAt: "2026-10-08T10:05:00.000Z" });
    const undone = applySaveSet(done, { setId: "a", weightKg: 32, reps: 8, rir: 1, completed: false, completedAt: null });
    expect(undone.exercises[0]!.sets[0]!.completedAt).toBeNull();
  });

  it("returns the same object for an unknown set id", () => {
    const base = session();
    expect(applySaveSet(base, { setId: "zzz", weightKg: 1, reps: 1, rir: 1, completed: true, completedAt: null })).toBe(base);
  });

  it("replays queued saves in order (last write wins)", () => {
    const next = applySaveSets(session(), [
      { setId: "a", weightKg: 30, reps: 8, rir: 2, completed: true, completedAt: "2026-10-08T10:05:00.000Z" },
      { setId: "a", weightKg: 32, reps: 7, rir: 1, completed: true, completedAt: "2026-10-08T10:06:00.000Z" },
    ]);
    expect(next.exercises[0]!.sets[0]!.weightKg).toBe(32);
  });

  it("adds and removes an extra set", () => {
    const extra = { id: "c", setNumber: 3, isWarmup: false, weightKg: null, reps: null, rir: null, completed: false, completedAt: null };
    const added = applyAddSet(session(), "es1", extra);
    expect(added.exercises[0]!.sets).toHaveLength(3);
    expect(applyAddSet(added, "es1", extra).exercises[0]!.sets).toHaveLength(3);
    expect(applyRemoveSet(added, "c").exercises[0]!.sets).toHaveLength(2);
  });
});
