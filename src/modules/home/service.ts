import { addDays, localDateString, weekRange } from "@/lib/time";
import { getUserSettings } from "@/modules/settings/repository";
import { listCompletedDates } from "@/modules/workouts/repository";
import { buildCalendar, weeklyStreak, type CalendarWeek, type Streak } from "./domain/consistency";
import { buildWeekWheel, type WeekWheel } from "./domain/week-wheel";

/** How many weeks the consistency calendar shows. */
export const CALENDAR_WEEKS = 12;

export interface WeekWheelData extends WeekWheel {
  weekStart: string;
}

export interface Consistency {
  wheel: WeekWheelData;
  calendar: CalendarWeek[];
  streak: Streak;
  totalDays: number;
}

/** The week as seven plates, the last 12 weeks as a calendar, and the weekly streak: one query for all three. */
export async function getConsistency(userId: string, now: Date = new Date()): Promise<Consistency> {
  const settings = await getUserSettings(userId);
  const today = localDateString(now, settings.timezone);
  const { start: weekStart, end: weekEnd } = weekRange(today, settings.weekStartsOn);
  const firstWeek = addDays(weekStart, -7 * (CALENDAR_WEEKS - 1));
  const completedDates = await listCompletedDates(userId, firstWeek, weekEnd);

  const calendar = buildCalendar({ currentWeekStart: weekStart, weeks: CALENDAR_WEEKS, today, completedDates });
  const wheel = buildWeekWheel({ weekStart, today, completedDates, target: settings.weeklyWorkoutTarget });
  return {
    wheel: { ...wheel, weekStart },
    calendar,
    streak: weeklyStreak(
      calendar.map((week) => week.completedDays),
      settings.weeklyWorkoutTarget,
    ),
    totalDays: calendar.reduce((sum, week) => sum + week.completedDays, 0),
  };
}
