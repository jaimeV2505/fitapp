import { addDays } from "@/lib/time";
import type { WeekTotals } from "../types";

/**
 * Returns exactly `count` consecutive weeks ending with the week that starts on `currentWeekStart`,
 * oldest first. Weeks with no workouts are filled with zeros so charts show gaps honestly.
 */
export function fillWeeks(rows: readonly WeekTotals[], currentWeekStart: string, count: number): WeekTotals[] {
  const byStart = new Map(rows.map((row) => [row.weekStart, row]));
  return Array.from({ length: count }, (_, index) => {
    const weekStart = addDays(currentWeekStart, -7 * (count - 1 - index));
    return byStart.get(weekStart) ?? { weekStart, sessions: 0, sets: 0, volumeKg: 0 };
  });
}
