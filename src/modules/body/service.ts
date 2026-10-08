import { AppError } from "@/lib/errors";
import { addDays, localDateString } from "@/lib/time";
import { averageDailyCalories } from "@/modules/nutrition/repository";
import { getUserSettings } from "@/modules/settings/repository";
import { buildWeightSeries, weightChange, type WeightEntry } from "./domain/series";
import { deleteMeasurementRow, insertMeasurement, listMeasurementsSince, listRecentMeasurements } from "./repository";
import { MEASURE_FIELDS, type BodyOverview, type MeasureSummary } from "./types";
import type { LogMeasurementInput } from "./validators";

const AVERAGE_WINDOW_DAYS = 7;

export async function getBodyOverview(userId: string, rangeDays: number, now: Date = new Date()): Promise<BodyOverview> {
  const settings = await getUserSettings(userId);
  const today = localDateString(now, settings.timezone);
  const rangeStart = addDays(today, -(rangeDays - 1));
  // Start earlier so the first chart points have a full moving-average window.
  const since = addDays(rangeStart, -(AVERAGE_WINDOW_DAYS - 1));

  const [rows, history, calories] = await Promise.all([
    listMeasurementsSince(userId, since),
    listRecentMeasurements(userId, 30),
    averageDailyCalories(userId, rangeStart, today),
  ]);

  const entries: WeightEntry[] = rows.flatMap((row) =>
    row.weightKg === null ? [] : [{ localDate: row.localDate, measuredAt: row.measuredAt, weightKg: row.weightKg }],
  );
  const series = buildWeightSeries(entries, rangeDays, today, AVERAGE_WINDOW_DAYS);
  const lastWeight = history.find((m) => m.weightKg !== null);

  const measures: MeasureSummary[] = MEASURE_FIELDS.flatMap((field) => {
    const taken = history.flatMap((m) => {
      const value = m[field];
      return value === null ? [] : [{ value, localDate: m.localDate }];
    });
    const [latest, previous] = taken;
    if (!latest) return [];
    const delta = previous ? Math.round((latest.value - previous.value) * 10) / 10 : null;
    return [{ field, latest: latest.value, delta, localDate: latest.localDate }];
  });

  return {
    rangeDays,
    series,
    change: weightChange(series),
    latestWeightKg: lastWeight?.weightKg ?? null,
    latestWeightDate: lastWeight?.localDate ?? null,
    measures,
    averageCalories: calories.average,
    loggedDays: calories.days,
    history,
  };
}

export async function logMeasurement(userId: string, input: LogMeasurementInput, now: Date = new Date()): Promise<{ id: string }> {
  const settings = await getUserSettings(userId);
  const today = localDateString(now, settings.timezone);
  const localDate = input.localDate ?? today;
  if (localDate > today) throw new AppError("validation", "You cannot log a measurement in the future.");

  const id = await insertMeasurement({
    userId,
    localDate,
    measuredAt: localDate === today ? now : new Date(`${localDate}T12:00:00Z`),
    weightKg: input.weightKg ?? null,
    bodyFatPercent: input.bodyFatPercent ?? null,
    waistCm: input.waistCm ?? null,
    chestCm: input.chestCm ?? null,
    armCm: input.armCm ?? null,
    legCm: input.legCm ?? null,
    notes: input.notes?.trim() ? input.notes.trim() : null,
  });
  return { id };
}

export async function deleteMeasurement(userId: string, id: string): Promise<void> {
  if (!(await deleteMeasurementRow(userId, id))) throw new AppError("not_found", "This entry no longer exists.");
}

/** Latest weigh-in for the dashboard. */
export async function getLatestWeight(userId: string): Promise<{ weightKg: number; localDate: string } | null> {
  const recent = await listRecentMeasurements(userId, 30);
  const last = recent.find((m) => m.weightKg !== null);
  return last && last.weightKg !== null ? { weightKg: last.weightKg, localDate: last.localDate } : null;
}
