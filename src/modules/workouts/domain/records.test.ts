import { describe, expect, it } from "vitest";
import { bestsOf, evaluateSet, findSessionRecords } from "./records";

const baseline = { maxWeightKg: 32, bestE1RmKg: 42.7 };

describe("bestsOf", () => {
  it("finds the heaviest weight and best estimated 1RM, ignoring empty sets", () => {
    const bests = bestsOf([
      { weightKg: 30, reps: 10 },
      { weightKg: 34, reps: 6 },
      { weightKg: null, reps: 12 },
    ]);
    expect(bests.maxWeightKg).toBe(34);
    expect(bests.bestE1RmKg).toBe(40.8);
  });
});

describe("evaluateSet", () => {
  it("never fires without earlier history", () => {
    expect(evaluateSet(null, [], { weightKg: 100, reps: 5 })).toBeNull();
  });

  it("fires a weight record when heavier than anything before", () => {
    expect(evaluateSet(baseline, [], { weightKg: 34, reps: 6 })).toEqual({ kind: "weight", valueKg: 34, weightKg: 34, reps: 6 });
  });

  it("fires an estimated 1RM record for more reps at the same weight", () => {
    const hit = evaluateSet(baseline, [], { weightKg: 32, reps: 12 });
    expect(hit?.kind).toBe("e1rm");
    expect(hit?.valueKg).toBe(44.8);
  });

  it("does not fire for a set that matches the best", () => {
    expect(evaluateSet(baseline, [], { weightKg: 32, reps: 10 })).toBeNull();
  });

  it("does not repeat a record already set earlier in the same session", () => {
    const first = { weightKg: 34, reps: 6 };
    expect(evaluateSet(baseline, [first], { weightKg: 34, reps: 6 })).toBeNull();
    expect(evaluateSet(baseline, [first], { weightKg: 36, reps: 4 })?.kind).toBe("weight");
  });
});

describe("findSessionRecords", () => {
  it("returns the best weight and best estimate that beat the baseline", () => {
    const hits = findSessionRecords(baseline, [
      { weightKg: 32, reps: 8 },
      { weightKg: 34, reps: 6 },
      { weightKg: 34, reps: 10 },
    ]);
    expect(hits.map((h) => h.kind)).toEqual(["weight", "e1rm"]);
    expect(hits[0]?.weightKg).toBe(34);
    expect(hits[0]?.reps).toBe(10);
  });

  it("returns nothing when no baseline or nothing improved", () => {
    expect(findSessionRecords(null, [{ weightKg: 99, reps: 5 }])).toEqual([]);
    expect(findSessionRecords(baseline, [{ weightKg: 30, reps: 8 }])).toEqual([]);
  });
});
