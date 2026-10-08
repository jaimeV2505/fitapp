import type { PreviousPerformance } from "../types";

const EN_DASH = "\u2013";

export function formatRepRange(min: number, max: number): string {
  return min === max ? String(min) : `${min}${EN_DASH}${max}`;
}

/** "4 × 6–8" */
export function formatTarget(sets: number, repMin: number, repMax: number): string {
  return `${sets} \u00d7 ${formatRepRange(repMin, repMax)}`;
}

export function formatWeight(weightKg: number | null): string {
  if (weightKg === null) return "\u2013";
  return Number.isInteger(weightKg) ? String(weightKg) : weightKg.toFixed(1).replace(/\.0$/, "");
}

export interface PreviousSummary {
  /** Heaviest weight used, e.g. "32 kg". Null when no weights were logged. */
  weightLabel: string | null;
  /** Reps per set, e.g. "8 / 8 / 7 / 6". */
  repsLabel: string;
}

export function summarizePrevious(previous: PreviousPerformance | null): PreviousSummary | null {
  if (!previous || previous.sets.length === 0) return null;
  const weights = previous.sets.map((s) => s.weightKg).filter((w): w is number => w !== null);
  const topWeight = weights.length > 0 ? Math.max(...weights) : null;
  const repsLabel = previous.sets.map((s) => (s.reps === null ? "\u2013" : String(s.reps))).join(" / ");
  return { weightLabel: topWeight === null ? null : `${formatWeight(topWeight)} kg`, repsLabel };
}

export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatVolume(totalKg: number): string {
  return `${Math.round(totalKg).toLocaleString("en-US")} kg`;
}
