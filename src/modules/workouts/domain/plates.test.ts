import { describe, expect, it } from "vitest";
import { computePlateLoad, groupPlates, plateStyle, warmupSets } from "./plates";

describe("computePlateLoad", () => {
  it("loads the heaviest plates first", () => {
    const load = computePlateLoad(100);
    expect(load.perSide).toEqual([25, 15]);
    expect(load.achievedKg).toBe(100);
    expect(load.remainderKg).toBe(0);
  });

  it("handles small plates without float drift", () => {
    expect(computePlateLoad(62.5).perSide).toEqual([20, 1.25]);
    expect(computePlateLoad(62.5).achievedKg).toBe(62.5);
    expect(computePlateLoad(87.5).perSide).toEqual([25, 5, 2.5, 1.25]);
  });

  it("uses an empty side for the bare bar and for lighter targets", () => {
    expect(computePlateLoad(20).perSide).toEqual([]);
    const light = computePlateLoad(15);
    expect(light.perSide).toEqual([]);
    expect(light.achievedKg).toBe(20);
  });

  it("reports what could not be reached", () => {
    const load = computePlateLoad(61);
    expect(load.achievedKg).toBe(60);
    expect(load.remainderKg).toBe(1);
  });

  it("respects a lighter bar and a limited set of plates", () => {
    expect(computePlateLoad(35, 15).perSide).toEqual([10]);
    expect(computePlateLoad(100, 20, [20, 10]).perSide).toEqual([20, 20]);
  });
});

describe("plateStyle", () => {
  it("colours plates like Olympic plates", () => {
    expect(plateStyle(25).color).toBe("red");
    expect(plateStyle(20).color).toBe("blue");
    expect(plateStyle(15).color).toBe("yellow");
    expect(plateStyle(10).color).toBe("green");
    expect(plateStyle(5).color).toBe("white");
    expect(plateStyle(1.25).color).toBe("steel");
  });
});

describe("warmupSets", () => {
  it("ramps from the bar to just under the working weight with fewer reps each time", () => {
    const ramp = warmupSets(100);
    expect(ramp).toEqual([
      { kg: 20, reps: 10 },
      { kg: 50, reps: 5 },
      { kg: 70, reps: 3 },
      { kg: 85, reps: 1 },
    ]);
  });

  it("never repeats or exceeds the working weight", () => {
    const ramp = warmupSets(40);
    expect(ramp.every((s) => s.kg < 40)).toBe(true);
    expect(new Set(ramp.map((s) => s.kg)).size).toBe(ramp.length);
  });

  it("needs no ramp for bar-weight or lighter work", () => {
    expect(warmupSets(20)).toEqual([]);
    expect(warmupSets(10)).toEqual([]);
  });
});

describe("groupPlates", () => {
  it("groups equal plates", () => {
    expect(groupPlates([25, 25, 10, 2.5, 2.5])).toEqual([
      { kg: 25, count: 2 },
      { kg: 10, count: 1 },
      { kg: 2.5, count: 2 },
    ]);
    expect(groupPlates([])).toEqual([]);
  });
});
