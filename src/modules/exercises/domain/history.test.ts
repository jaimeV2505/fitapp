import { describe, expect, it } from "vitest";
import type { HistorySetRow } from "../types";
import { buildExerciseHistory, computeRecords, estimate1Rm } from "./history";

const row = (sessionId: string, localDate: string, weightKg: number | null, reps: number | null): HistorySetRow => ({
  sessionId,
  localDate,
  weightKg,
  reps,
});

describe("estimate1Rm", () => {
  it("uses the Epley formula and returns the weight itself for a single", () => {
    expect(estimate1Rm(100, 1)).toBe(100);
    expect(estimate1Rm(80, 10)).toBe(106.7);
  });

  it("returns null when the estimate would not be reliable or inputs are missing", () => {
    expect(estimate1Rm(30, 20)).toBeNull();
    expect(estimate1Rm(null, 8)).toBeNull();
    expect(estimate1Rm(0, 8)).toBeNull();
  });
});

describe("buildExerciseHistory", () => {
  const rows = [
    // newest session first, as returned by the query
    row("s3", "2026-10-06", 32, 10),
    row("s3", "2026-10-06", 32, 9),
    row("s3", "2026-10-06", 30, 8),
    row("s2", "2026-09-29", 30, 10),
    row("s2", "2026-09-29", 30, 9),
    row("s1", "2026-09-22", 28, 10),
  ];

  it("returns sessions in chronological order with per-session numbers", () => {
    const history = buildExerciseHistory(rows, 12);
    expect(history.map((p) => p.sessionId)).toEqual(["s1", "s2", "s3"]);
    const latest = history[2]!;
    expect(latest.sets).toBe(3);
    expect(latest.topWeightKg).toBe(32);
    expect(latest.repsAtTopWeight).toBe(10);
    expect(latest.totalVolumeKg).toBe(32 * 10 + 32 * 9 + 30 * 8);
    expect(latest.estimated1RmKg).toBe(42.7);
  });

  it("keeps only the most recent sessions", () => {
    const history = buildExerciseHistory(rows, 2);
    expect(history.map((p) => p.sessionId)).toEqual(["s2", "s3"]);
  });

  it("handles bodyweight sets without weights", () => {
    const [point] = buildExerciseHistory([row("a", "2026-10-01", null, 12)], 5);
    expect(point?.topWeightKg).toBeNull();
    expect(point?.totalVolumeKg).toBe(0);
  });
});

describe("computeRecords", () => {
  it("finds the best values across sessions", () => {
    const history = buildExerciseHistory(
      [row("s2", "2026-10-06", 32, 10), row("s1", "2026-09-29", 34, 6)],
      12,
    );
    const records = computeRecords(history);
    expect(records.maxWeightKg).toBe(34);
    expect(records.bestSessionVolumeKg).toBe(320);
    expect(records.bestEstimated1RmKg).toBe(42.7);
  });

  it("returns nulls for an empty history", () => {
    expect(computeRecords([])).toEqual({ maxWeightKg: null, bestEstimated1RmKg: null, bestSessionVolumeKg: null });
  });
});
