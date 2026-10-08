import { describe, expect, it } from "vitest";
import { buildCalendar, weeklyStreak } from "./consistency";

describe("buildCalendar", () => {
  const calendar = buildCalendar({
    currentWeekStart: "2026-10-05",
    weeks: 3,
    today: "2026-10-08",
    completedDates: ["2026-09-23", "2026-10-05", "2026-10-07", "2026-10-07"],
  });

  it("lists the weeks oldest first, the current one last, seven days each", () => {
    expect(calendar.map((w) => w.weekStart)).toEqual(["2026-09-21", "2026-09-28", "2026-10-05"]);
    expect(calendar.every((w) => w.cells.length === 7)).toBe(true);
    expect(calendar[2]?.cells[0]?.date).toBe("2026-10-05");
    expect(calendar[2]?.cells[6]?.date).toBe("2026-10-11");
  });

  it("marks done, today, past and future days", () => {
    const current = calendar[2]?.cells.map((c) => c.state);
    expect(current).toEqual(["done", "past", "done", "today", "future", "future", "future"]);
    expect(calendar[0]?.cells[2]?.state).toBe("done");
    expect(calendar[0]?.cells[0]?.state).toBe("past");
  });

  it("counts a day once however many workouts it had", () => {
    expect(calendar[2]?.completedDays).toBe(2);
    expect(calendar[0]?.completedDays).toBe(1);
    expect(calendar[1]?.completedDays).toBe(0);
  });
});

describe("weeklyStreak", () => {
  it("counts consecutive weeks that reached the goal, including the current one when met", () => {
    expect(weeklyStreak([1, 3, 4, 3], 3)).toEqual({ current: 3, best: 3 });
  });

  it("does not break the streak while the current week is still in progress", () => {
    expect(weeklyStreak([3, 4, 3, 1], 3)).toEqual({ current: 3, best: 3 });
  });

  it("breaks on a past week that missed the goal", () => {
    expect(weeklyStreak([3, 3, 1, 3], 3)).toEqual({ current: 1, best: 2 });
    expect(weeklyStreak([3, 3, 3, 1, 0], 3)).toEqual({ current: 0, best: 3 });
  });

  it("remembers the best run even when the current streak is shorter", () => {
    expect(weeklyStreak([4, 4, 4, 4, 0, 3, 1], 3)).toEqual({ current: 1, best: 4 });
  });

  it("gives nothing for a zero goal or no weeks", () => {
    expect(weeklyStreak([5, 5], 0)).toEqual({ current: 0, best: 0 });
    expect(weeklyStreak([], 3)).toEqual({ current: 0, best: 0 });
  });
});
