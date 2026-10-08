import { describe, expect, it } from "vitest";
import { buildWeekWheel } from "./week-wheel";

describe("buildWeekWheel", () => {
  const base = { weekStart: "2026-10-05", target: 3 };

  it("marks done, today, past and future days", () => {
    const wheel = buildWeekWheel({ ...base, today: "2026-10-08", completedDates: ["2026-10-05", "2026-10-07"] });
    expect(wheel.days.map((d) => d.state)).toEqual(["done", "past", "done", "today", "future", "future", "future"]);
    expect(wheel.days.map((d) => d.date)[0]).toBe("2026-10-05");
    expect(wheel.days[6]?.date).toBe("2026-10-11");
    expect(wheel.completedDays).toBe(2);
    expect(wheel.goalReached).toBe(false);
  });

  it("reaches the goal when enough distinct days are done", () => {
    const wheel = buildWeekWheel({ ...base, today: "2026-10-08", completedDates: ["2026-10-05", "2026-10-06", "2026-10-08", "2026-10-08"] });
    expect(wheel.completedDays).toBe(3);
    expect(wheel.goalReached).toBe(true);
    expect(wheel.days[3]).toMatchObject({ state: "done", doneToday: true });
  });

  it("never reaches a goal of zero", () => {
    expect(buildWeekWheel({ weekStart: "2026-10-05", today: "2026-10-08", completedDates: [], target: 0 }).goalReached).toBe(false);
  });
});
