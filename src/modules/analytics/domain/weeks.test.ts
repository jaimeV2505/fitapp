import { describe, expect, it } from "vitest";
import { fillWeeks } from "./weeks";

describe("fillWeeks", () => {
  it("returns consecutive weeks oldest first and fills gaps with zeros", () => {
    const weeks = fillWeeks(
      [
        { weekStart: "2026-10-05", sessions: 3, sets: 60, volumeKg: 12000 },
        { weekStart: "2026-09-21", sessions: 4, sets: 80, volumeKg: 15000 },
      ],
      "2026-10-05",
      4,
    );
    expect(weeks.map((w) => w.weekStart)).toEqual(["2026-09-14", "2026-09-21", "2026-09-28", "2026-10-05"]);
    expect(weeks[0]?.volumeKg).toBe(0);
    expect(weeks[1]?.volumeKg).toBe(15000);
    expect(weeks[2]?.sessions).toBe(0);
    expect(weeks[3]?.sets).toBe(60);
  });
});
