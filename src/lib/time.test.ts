import { describe, expect, it } from "vitest";
import { addDays, formatLongDate, formatShortDate, greetingFor, isoWeekdayLabel, isoWeekday, isoWeekdayOfLocalDate, localDateString, weekRange } from "./time";

describe("time helpers", () => {
  it("uses the user's timezone for the calendar date", () => {
    // 23:30 UTC on Oct 7 is already Oct 8 in Stockholm (UTC+2 in October).
    const instant = new Date("2026-10-07T23:30:00Z");
    expect(localDateString(instant, "UTC")).toBe("2026-10-07");
    expect(localDateString(instant, "Europe/Stockholm")).toBe("2026-10-08");
  });

  it("returns ISO weekdays (Monday = 1)", () => {
    expect(isoWeekday(new Date("2026-10-08T12:00:00Z"), "Europe/Stockholm")).toBe(4); // Thursday
    expect(isoWeekdayOfLocalDate("2026-10-11")).toBe(7); // Sunday
  });

  it("adds days across month boundaries", () => {
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("computes the week range for Monday and Sunday week starts", () => {
    expect(weekRange("2026-10-08", 1)).toEqual({ start: "2026-10-05", end: "2026-10-11" });
    expect(weekRange("2026-10-11", 1)).toEqual({ start: "2026-10-05", end: "2026-10-11" });
    expect(weekRange("2026-10-08", 7)).toEqual({ start: "2026-10-04", end: "2026-10-10" });
  });

  it("chooses a greeting by hour", () => {
    expect(greetingFor(8)).toBe("morning");
    expect(greetingFor(15)).toBe("afternoon");
    expect(greetingFor(20)).toBe("evening");
    expect(greetingFor(2)).toBe("night");
  });

  it("formats dates in the requested language", () => {
    expect(formatShortDate("2026-10-08", "en-US")).toBe("Oct 8");
    expect(formatShortDate("2026-10-08", "es-ES")).toMatch(/8 oct/);
    expect(formatLongDate("2026-10-08", "es-ES")).toMatch(/jueves/i);
  });

  it("names ISO weekdays in either language", () => {
    expect(isoWeekdayLabel(1, "long", "en-US")).toBe("Monday");
    expect(isoWeekdayLabel(3, "short", "en-US")).toBe("Wed");
    expect(isoWeekdayLabel(1, "long", "es-ES")).toBe("Lunes");
    expect(isoWeekdayLabel(7, "long", "es-ES")).toBe("Domingo");
  });
});
