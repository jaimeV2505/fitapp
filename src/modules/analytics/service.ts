import { addDays, localDateString, weekRange } from "@/lib/time";
import { getUserSettings } from "@/modules/settings/repository";
import { fillWeeks } from "./domain/weeks";
import { countAllCompleted, listMuscleSets, listWeeklyTotals } from "./repository";
import type { ProgressOverview } from "./types";

const WEEKS_SHOWN = 8;

export async function getProgressOverview(userId: string, now: Date = new Date()): Promise<ProgressOverview> {
  const settings = await getUserSettings(userId);
  const today = localDateString(now, settings.timezone);
  const current = weekRange(today, settings.weekStartsOn);
  const firstWeek = addDays(current.start, -7 * (WEEKS_SHOWN - 1));

  const [rows, muscleSets, totalWorkouts] = await Promise.all([
    listWeeklyTotals(userId, firstWeek, settings.weekStartsOn),
    listMuscleSets(userId, current.start, current.end),
    countAllCompleted(userId),
  ]);

  const weeks = fillWeeks(rows, current.start, WEEKS_SHOWN);
  const thisWeek = weeks[weeks.length - 1] ?? { weekStart: current.start, sessions: 0, sets: 0, volumeKg: 0 };
  return { weeks, thisWeek, muscleSets, totalWorkouts };
}
