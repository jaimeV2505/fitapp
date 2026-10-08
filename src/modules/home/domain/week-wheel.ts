import { addDays } from "@/lib/time";

export type WheelDayState = "done" | "today" | "past" | "future";

export interface WheelDay {
  /** YYYY-MM-DD */
  date: string;
  /** ISO weekday, 1 = Monday ... 7 = Sunday */
  weekday: number;
  state: WheelDayState;
  /** True when this is today AND a workout was already completed today. */
  doneToday: boolean;
}

export interface WeekWheel {
  days: WheelDay[];
  completedDays: number;
  target: number;
  goalReached: boolean;
}

/**
 * The week as seven discs: which days have a completed workout, which is today, which are still to come.
 * `completedDates` are YYYY-MM-DD strings (several workouts on one day count once).
 */
export function buildWeekWheel(input: { weekStart: string; today: string; completedDates: readonly string[]; target: number }): WeekWheel {
  const done = new Set(input.completedDates);
  const days: WheelDay[] = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(input.weekStart, index);
    const isDone = done.has(date);
    const isToday = date === input.today;
    const state: WheelDayState = isDone ? "done" : isToday ? "today" : date < input.today ? "past" : "future";
    return { date, weekday: index + 1, state, doneToday: isToday && isDone };
  });
  const completedDays = days.filter((day) => day.state === "done").length;
  return { days, completedDays, target: input.target, goalReached: input.target > 0 && completedDays >= input.target };
}
