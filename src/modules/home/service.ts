import { localDateString, weekRange } from "@/lib/time";
import { getUserSettings } from "@/modules/settings/repository";
import { listCompletedDates } from "@/modules/workouts/repository";
import { buildWeekWheel, type WeekWheel } from "./domain/week-wheel";

export interface WeekWheelData extends WeekWheel {
  weekStart: string;
}

/** The current week as seven discs, for the home screen. */
export async function getWeekWheel(userId: string, now: Date = new Date()): Promise<WeekWheelData> {
  const settings = await getUserSettings(userId);
  const today = localDateString(now, settings.timezone);
  const { start, end } = weekRange(today, settings.weekStartsOn);
  const completedDates = await listCompletedDates(userId, start, end);
  return { ...buildWeekWheel({ weekStart: start, today, completedDates, target: settings.weeklyWorkoutTarget }), weekStart: start };
}
