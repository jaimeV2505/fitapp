import { describe, expect, it } from "vitest";
import { buildTrends } from "./trend";

const row = (exerciseId: string, day: number, topWeightKg: number | null) => ({
  exerciseId,
  sessionId: `${exerciseId}-${day}`,
  startedAt: `2026-09-${String(day).padStart(2, "0")}T10:00:00Z`,
  topWeightKg,
});

describe("buildTrends", () => {
  it("returns weights oldest first per exercise", () => {
    const trends = buildTrends([row("a", 20, 30), row("a", 27, 32), row("b", 21, 50), row("a", 6, 28)]);
    expect(trends.get("a")).toEqual([28, 30, 32]);
    expect(trends.get("b")).toEqual([50]);
  });

  it("keeps only the most recent sessions", () => {
    const rows = Array.from({ length: 12 }, (_, i) => row("a", i + 1, 20 + i));
    expect(buildTrends(rows, 8).get("a")).toEqual([24, 25, 26, 27, 28, 29, 30, 31]);
  });

  it("skips sessions without a weight", () => {
    expect(buildTrends([row("a", 1, null), row("a", 2, 40)]).get("a")).toEqual([40]);
    expect(buildTrends([row("a", 1, null)]).has("a")).toBe(false);
  });
});
