import { MUSCLE_GROUPS, type MuscleGroup } from "@/lib/db/schema/enums";
import type { MuscleSets } from "../types";

/** Cool to hot: the colour of the plates (blue, green, yellow) continuing into orange and red. Level 1 to 5. */
export const HEAT_COLORS = ["#4c7bea", "#2fb56f", "#f4c531", "#f08a24", "#e5483d"] as const;

/** 0 = untouched, 5 = a very high weekly volume. Thresholds are completed working sets per muscle in a week. */
export type HeatLevel = 0 | 1 | 2 | 3 | 4 | 5;

const THRESHOLDS: readonly number[] = [1, 5, 10, 15, 20]; // lower bound of levels 1..5

export function heatLevel(sets: number): HeatLevel {
  let level = 0;
  for (const [index, threshold] of THRESHOLDS.entries()) if (sets >= threshold) level = index + 1;
  return level as HeatLevel;
}

export interface HeatCell {
  muscle: MuscleGroup;
  sets: number;
  level: HeatLevel;
}

/** Every muscle group (including the ones not trained this week) with its volume and heat level. */
export function buildHeatMap(rows: readonly MuscleSets[]): HeatCell[] {
  const setsByMuscle = new Map(rows.map((row) => [row.muscle, row.sets]));
  return MUSCLE_GROUPS.map((muscle) => {
    const sets = setsByMuscle.get(muscle) ?? 0;
    return { muscle, sets, level: heatLevel(sets) };
  });
}

/** The colour of a heat level, or null for level 0 (no colour: the muscle keeps the neutral tone). */
export function heatColor(level: HeatLevel): string | null {
  return level === 0 ? null : (HEAT_COLORS[level - 1] ?? null);
}

/** Text of each legend step, for example "1-4". */
export const HEAT_LEGEND: readonly string[] = ["0", "1-4", "5-9", "10-14", "15-19", "20+"];
