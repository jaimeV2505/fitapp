import { addDays } from "@/lib/time";

export interface WeightEntry {
  localDate: string;
  /** ISO timestamp; the latest entry of a day wins. */
  measuredAt: string;
  weightKg: number;
}

export interface WeightPoint {
  localDate: string;
  weightKg: number;
  /** Trailing average over the last `windowDays` calendar days (including this one). */
  averageKg: number;
}

const round1 = (value: number): number => Math.round(value * 10) / 10;

/** One value per calendar day (the latest measurement), oldest first. */
export function dailyWeights(entries: readonly WeightEntry[]): { localDate: string; weightKg: number }[] {
  const latest = new Map<string, WeightEntry>();
  for (const entry of entries) {
    const current = latest.get(entry.localDate);
    if (!current || entry.measuredAt > current.measuredAt) latest.set(entry.localDate, entry);
  }
  return [...latest.values()]
    .sort((a, b) => a.localDate.localeCompare(b.localDate))
    .map((entry) => ({ localDate: entry.localDate, weightKg: entry.weightKg }));
}

/**
 * Smooths day-to-day noise (water, food, sleep) with a trailing average over calendar days.
 * Days without a weigh-in simply have fewer samples; the average is never extrapolated.
 */
export function withMovingAverage(
  daily: readonly { localDate: string; weightKg: number }[],
  windowDays = 7,
): WeightPoint[] {
  return daily.map((point) => {
    const from = addDays(point.localDate, -(windowDays - 1));
    const window = daily.filter((other) => other.localDate >= from && other.localDate <= point.localDate);
    const mean = window.reduce((sum, p) => sum + p.weightKg, 0) / window.length;
    return { ...point, averageKg: round1(mean) };
  });
}

/**
 * Series for a chart range (7, 30 or 90 days ending today). Pass entries from at least
 * `windowDays - 1` days before the range start so the first points have a proper average.
 */
export function buildWeightSeries(entries: readonly WeightEntry[], rangeDays: number, today: string, windowDays = 7): WeightPoint[] {
  const start = addDays(today, -(rangeDays - 1));
  return withMovingAverage(dailyWeights(entries), windowDays).filter((p) => p.localDate >= start && p.localDate <= today);
}

export interface WeightChange {
  fromKg: number;
  toKg: number;
  deltaKg: number;
}

/** Change of the smoothed weight across the series. Null with fewer than two points. */
export function weightChange(series: readonly WeightPoint[]): WeightChange | null {
  const first = series[0];
  const last = series[series.length - 1];
  if (!first || !last || series.length < 2) return null;
  return { fromKg: first.averageKg, toKg: last.averageKg, deltaKg: round1(last.averageKg - first.averageKg) };
}
