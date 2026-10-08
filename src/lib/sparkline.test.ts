import { describe, expect, it } from "vitest";
import { sparklinePath, sparklinePoints, trendDirection } from "./sparkline";

describe("sparklinePoints", () => {
  it("puts the highest value at the top and the lowest at the bottom", () => {
    const points = sparklinePoints([10, 20, 15], 60, 20, 2);
    expect(points[0]).toEqual({ x: 2, y: 18 });
    expect(points[1]).toEqual({ x: 30, y: 2 });
    expect(points[2]).toEqual({ x: 58, y: 10 });
  });

  it("draws a flat series in the middle and a single value at the centre", () => {
    expect(sparklinePoints([5, 5, 5], 60, 20).every((p) => p.y === 10)).toBe(true);
    expect(sparklinePoints([5], 60, 20)).toEqual([{ x: 30, y: 10 }]);
    expect(sparklinePoints([], 60, 20)).toEqual([]);
  });
});

describe("sparklinePath", () => {
  it("builds an SVG path", () => {
    expect(sparklinePath([{ x: 1, y: 2 }, { x: 3, y: 4 }])).toBe("M1 2 L3 4");
  });
});

describe("trendDirection", () => {
  it("compares the last value with the first", () => {
    expect(trendDirection([30, 32, 35])).toBe("up");
    expect(trendDirection([35, 30])).toBe("down");
    expect(trendDirection([30, 40, 30])).toBe("flat");
    expect(trendDirection([])).toBe("flat");
  });
});
