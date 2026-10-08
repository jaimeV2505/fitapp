import type { WeightChange, WeightPoint } from "./domain/series";

export interface MeasurementView {
  id: string;
  localDate: string;
  weightKg: number | null;
  bodyFatPercent: number | null;
  waistCm: number | null;
  chestCm: number | null;
  armCm: number | null;
  legCm: number | null;
  notes: string | null;
}

export const MEASURE_FIELDS = ["bodyFatPercent", "waistCm", "chestCm", "armCm", "legCm"] as const;
export type MeasureField = (typeof MEASURE_FIELDS)[number];

export interface MeasureSummary {
  field: MeasureField;
  latest: number;
  /** Change since the previous time this measure was taken. Null the first time. */
  delta: number | null;
  localDate: string;
}

export interface BodyOverview {
  rangeDays: number;
  series: WeightPoint[];
  change: WeightChange | null;
  latestWeightKg: number | null;
  latestWeightDate: string | null;
  measures: MeasureSummary[];
  /** Average calories per day that has meals logged in the range (not per calendar day). */
  averageCalories: number | null;
  loggedDays: number;
  history: MeasurementView[];
}
