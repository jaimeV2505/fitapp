import { describe, expect, it } from "vitest";
import { suggestProgression, type ProgressionInput } from "./progression";

const base: ProgressionInput = { targetSets: 3, repMin: 8, repMax: 12, rirMin: 1, stepKg: 2.5, previous: [] };
const set = (weightKg: number, reps: number, rir: number | null = 1) => ({ weightKg, reps, rir });

describe("suggestProgression", () => {
  it("suggests nothing without history", () => {
    expect(suggestProgression(base)).toBeNull();
  });

  it("suggests more weight when every set reached the top of the range with controlled effort", () => {
    const result = suggestProgression({ ...base, previous: [set(30, 12), set(30, 12), set(30, 12, 2)] });
    expect(result).toMatchObject({ kind: "increase", fromKg: 30, toKg: 32.5 });
  });

  it("accepts all-but-one planned sets at the top weight", () => {
    const result = suggestProgression({ ...base, previous: [set(30, 12), set(30, 12)] });
    expect(result?.kind).toBe("increase");
  });

  it("holds the weight when the top reps came with too little reserve", () => {
    const result = suggestProgression({ ...base, previous: [set(30, 12, 0), set(30, 12), set(30, 12)] });
    expect(result?.kind).toBe("hold");
  });

  it("asks for one more rep when not every set reached the top of the range", () => {
    const result = suggestProgression({ ...base, previous: [set(30, 12), set(30, 10), set(30, 9)] });
    expect(result).toMatchObject({ kind: "build", weightKg: 30, targetReps: 10 });
  });

  it("ignores lighter back-off sets and treats missing RIR as acceptable", () => {
    const result = suggestProgression({ ...base, previous: [set(30, 12, null), set(30, 12, null), set(30, 12, null), set(20, 8)] });
    expect(result?.kind).toBe("increase");
  });

  it("does not suggest an increase after a single set at the top weight when more were planned", () => {
    const result = suggestProgression({ ...base, targetSets: 4, previous: [set(30, 12), set(25, 12), set(25, 12), set(25, 12)] });
    expect(result?.kind).toBe("build");
  });
});
