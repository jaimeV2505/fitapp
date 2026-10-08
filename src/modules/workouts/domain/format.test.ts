import { describe, expect, it } from "vitest";
import { formatDuration, formatRepRange, formatTarget, formatWeight, summarizePrevious } from "./format";

describe("formatting", () => {
  it("formats rep ranges and targets", () => {
    expect(formatRepRange(6, 8)).toBe("6\u20138");
    expect(formatRepRange(10, 10)).toBe("10");
    expect(formatTarget(4, 6, 8)).toBe("4 \u00d7 6\u20138");
  });

  it("formats weights without trailing zeros", () => {
    expect(formatWeight(32)).toBe("32");
    expect(formatWeight(32.5)).toBe("32.5");
    expect(formatWeight(null)).toBe("\u2013");
  });

  it("summarises the previous workout with the top weight and reps per set", () => {
    const summary = summarizePrevious({
      localDate: "2026-10-05",
      sets: [
        { weightKg: 32, reps: 8, rir: null },
        { weightKg: 32, reps: 8, rir: null },
        { weightKg: 30, reps: 7, rir: null },
        { weightKg: 30, reps: 6, rir: null },
      ],
    });
    expect(summary).toEqual({ weightLabel: "32 kg", repsLabel: "8 / 8 / 7 / 6" });
    expect(summarizePrevious(null)).toBeNull();
  });

  it("formats durations as m:ss", () => {
    expect(formatDuration(95)).toBe("1:35");
    expect(formatDuration(-5)).toBe("0:00");
  });
});
