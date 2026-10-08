import { describe, expect, it } from "vitest";
import { HEAT_COLORS, buildHeatMap, heatColor, heatLevel } from "./heat";

describe("heatLevel", () => {
  it("maps weekly sets to six levels", () => {
    expect([0, 1, 4, 5, 9, 10, 14, 15, 19, 20, 40].map(heatLevel)).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
  });
});

describe("buildHeatMap", () => {
  it("includes every muscle group, with zero for the untrained ones", () => {
    const cells = buildHeatMap([
      { muscle: "chest", sets: 16 },
      { muscle: "back", sets: 6 },
    ]);
    expect(cells).toHaveLength(12);
    expect(cells.find((c) => c.muscle === "chest")).toEqual({ muscle: "chest", sets: 16, level: 4 });
    expect(cells.find((c) => c.muscle === "back")?.level).toBe(2);
    expect(cells.find((c) => c.muscle === "calves")).toEqual({ muscle: "calves", sets: 0, level: 0 });
  });
});

describe("heatColor", () => {
  it("has no colour for untouched muscles and one of five colours for the rest", () => {
    expect(heatColor(0)).toBeNull();
    expect(heatColor(1)).toBe(HEAT_COLORS[0]);
    expect(heatColor(5)).toBe(HEAT_COLORS[4]);
  });
});
