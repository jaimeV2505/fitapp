/** Plates found in most gyms, heaviest first (kg, per side). */
export const PLATE_KG = [25, 20, 15, 10, 5, 2.5, 1.25] as const;

export type PlateColor = "red" | "blue" | "yellow" | "green" | "white" | "steel";

export interface PlateStyle {
  color: PlateColor;
  /** Diameter relative to the biggest plate, 0..1 (for drawing). */
  size: number;
}

/** Olympic plate colours: 25 red, 20 blue, 15 yellow, 10 green, 5 white. Small change plates are steel. */
export function plateStyle(kg: number): PlateStyle {
  if (kg >= 25) return { color: "red", size: 1 };
  if (kg >= 20) return { color: "blue", size: 1 };
  if (kg >= 15) return { color: "yellow", size: 0.92 };
  if (kg >= 10) return { color: "green", size: 0.8 };
  if (kg >= 5) return { color: "white", size: 0.64 };
  if (kg >= 2.5) return { color: "steel", size: 0.5 };
  return { color: "steel", size: 0.4 };
}

export interface PlateLoad {
  /** Plates on ONE side, heaviest (closest to the collar's inside) first. */
  perSide: number[];
  barKg: number;
  /** What the barbell actually weighs with those plates. */
  achievedKg: number;
  /** Target minus achieved: positive when the target is not reachable with the available plates. */
  remainderKg: number;
}

const GRAMS = 1000;
const toGrams = (kg: number): number => Math.round(kg * GRAMS);

/**
 * Which plates to put on each side of the bar to reach `targetKg`. Greedy from the heaviest plate, which is
 * optimal for the usual plate sets. Works in grams so 2.5 + 1.25 style sums never drift.
 */
export function computePlateLoad(targetKg: number, barKg = 20, available: readonly number[] = PLATE_KG): PlateLoad {
  const bar = toGrams(barKg);
  const target = Math.max(toGrams(targetKg), 0);
  let remainingPerSide = Math.max(Math.floor((target - bar) / 2), 0);

  const perSide: number[] = [];
  for (const plate of [...available].sort((a, b) => b - a)) {
    const grams = toGrams(plate);
    while (grams > 0 && remainingPerSide >= grams) {
      perSide.push(plate);
      remainingPerSide -= grams;
    }
  }

  const achieved = bar + 2 * perSide.reduce((sum, plate) => sum + toGrams(plate), 0);
  return {
    perSide,
    barKg,
    achievedKg: achieved / GRAMS,
    remainderKg: Math.max(target - achieved, 0) / GRAMS,
  };
}

export interface WarmupSet {
  kg: number;
  reps: number;
}

const STEP_KG = 2.5;
const roundToStep = (kg: number): number => Math.round(kg / STEP_KG) * STEP_KG;

/**
 * A simple warm-up ramp towards the working weight: the empty bar, then about 50%, 70% and 85%,
 * with fewer reps as the weight rises. Weights are rounded to loadable steps and never go below the bar.
 * Very light working weights need no ramp beyond the bar.
 */
export function warmupSets(workingKg: number, barKg = 20): WarmupSet[] {
  if (workingKg <= barKg) return [];
  const ramp: WarmupSet[] = [
    { kg: barKg, reps: 10 },
    { kg: roundToStep(workingKg * 0.5), reps: 5 },
    { kg: roundToStep(workingKg * 0.7), reps: 3 },
    { kg: roundToStep(workingKg * 0.85), reps: 1 },
  ];
  const seen = new Set<number>();
  return ramp.filter((set) => {
    const valid = set.kg >= barKg && set.kg < workingKg && !seen.has(set.kg);
    if (valid) seen.add(set.kg);
    return valid;
  });
}

export interface PlateGroup {
  kg: number;
  count: number;
}

/** [25, 25, 10] -> [{ kg: 25, count: 2 }, { kg: 10, count: 1 }]. Equal plates are adjacent in a load. */
export function groupPlates(perSide: readonly number[]): PlateGroup[] {
  const groups: PlateGroup[] = [];
  for (const kg of perSide) {
    const last = groups[groups.length - 1];
    if (last && last.kg === kg) last.count += 1;
    else groups.push({ kg, count: 1 });
  }
  return groups;
}
