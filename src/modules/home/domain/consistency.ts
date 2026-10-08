import { addDays } from "@/lib/time";

export type CalendarState = "done" | "today" | "past" | "future";

export interface CalendarCell {
  /** YYYY-MM-DD */
  date: string;
  /** ISO weekday, 1 = Monday ... 7 = Sunday */
  weekday: number;
  state: CalendarState;
}

export interface CalendarWeek {
  weekStart: string;
  cells: CalendarCell[];
  /** Distinct days with a completed workout. */
  completedDays: number;
}

/**
 * The last `weeks` weeks (oldest first, the current one last) as rows of seven days.
 * `completedDates` may repeat a date: two workouts on one day count as one day.
 */
export function buildCalendar(input: { currentWeekStart: string; weeks: number; today: string; completedDates: readonly string[] }): CalendarWeek[] {
  const done = new Set(input.completedDates);
  return Array.from({ length: input.weeks }, (_, index) => {
    const weekStart = addDays(input.currentWeekStart, -7 * (input.weeks - 1 - index));
    const cells = Array.from({ length: 7 }, (_, day): CalendarCell => {
      const date = addDays(weekStart, day);
      const state: CalendarState = done.has(date) ? "done" : date === input.today ? "today" : date < input.today ? "past" : "future";
      return { date, weekday: day + 1, state };
    });
    return { weekStart, cells, completedDays: cells.filter((cell) => cell.state === "done").length };
  });
}

export interface Streak {
  /** Consecutive weeks that reached the goal, ending now. */
  current: number;
  /** The longest run in the period shown. */
  best: number;
}

/**
 * Streak of weeks in which the weekly goal was reached. `weekCounts` are workout days per week, oldest first, the
 * current (unfinished) week last. The current week never breaks a streak: it only adds to it once the goal is met,
 * so a streak is not lost on a Monday morning. A goal of zero gives no streak.
 */
export function weeklyStreak(weekCounts: readonly number[], target: number): Streak {
  if (target <= 0 || weekCounts.length === 0) return { current: 0, best: 0 };
  const met = weekCounts.map((count) => count >= target);

  let best = 0;
  let run = 0;
  for (const reached of met) {
    run = reached ? run + 1 : 0;
    best = Math.max(best, run);
  }

  let current = 0;
  let index = met.length - 1;
  if (met[index]) current += 1;
  index -= 1; // an unfinished current week is skipped, not counted against the streak
  while (index >= 0 && met[index]) {
    current += 1;
    index -= 1;
  }
  return { current, best };
}
