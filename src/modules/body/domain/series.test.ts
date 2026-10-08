import { describe, expect, it } from "vitest";
import { buildWeightSeries, dailyWeights, weightChange, withMovingAverage, type WeightEntry } from "./series";

const entry = (localDate: string, weightKg: number, time = "08:00"): WeightEntry => ({
  localDate,
  weightKg,
  measuredAt: `${localDate}T${time}:00Z`,
});

describe("dailyWeights", () => {
  it("keeps the latest measurement of each day, oldest first", () => {
    const daily = dailyWeights([entry("2026-10-02", 75.0), entry("2026-10-01", 74.0, "07:00"), entry("2026-10-01", 74.4, "21:00")]);
    expect(daily).toEqual([
      { localDate: "2026-10-01", weightKg: 74.4 },
      { localDate: "2026-10-02", weightKg: 75 },
    ]);
  });
});

describe("withMovingAverage", () => {
  it("averages over the trailing calendar window only", () => {
    const points = withMovingAverage(
      [
        { localDate: "2026-10-01", weightKg: 75 },
        { localDate: "2026-10-02", weightKg: 74 },
        { localDate: "2026-10-10", weightKg: 73 },
      ],
      7,
    );
    expect(points.map((p) => p.averageKg)).toEqual([75, 74.5, 73]);
  });
});

describe("buildWeightSeries and weightChange", () => {
  const entries = [
    entry("2026-09-28", 76),
    entry("2026-10-01", 75),
    entry("2026-10-04", 74.5),
    entry("2026-10-07", 74),
  ];

  it("restricts to the range but uses earlier entries for the average", () => {
    const series = buildWeightSeries(entries, 7, "2026-10-07");
    expect(series.map((p) => p.localDate)).toEqual(["2026-10-01", "2026-10-04", "2026-10-07"]);
    expect(series[0]?.averageKg).toBe(75.5);
  });

  it("reports the change of the smoothed weight", () => {
    const series = buildWeightSeries(entries, 30, "2026-10-07");
    expect(weightChange(series)).toEqual({ fromKg: 76, toKg: 74.5, deltaKg: -1.5 });
  });

  it("returns null change for fewer than two points", () => {
    expect(weightChange(buildWeightSeries([entry("2026-10-07", 74)], 7, "2026-10-07"))).toBeNull();
  });
});
