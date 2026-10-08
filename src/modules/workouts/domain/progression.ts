import type { MessageKey } from "@/lib/i18n/types";

export interface ProgressionSet {
  weightKg: number | null;
  reps: number | null;
  rir: number | null;
}

export interface ProgressionInput {
  targetSets: number;
  repMin: number;
  repMax: number;
  /** Lowest RIR that still counts as controlled work for this exercise. */
  rirMin: number;
  /** Smallest sensible weight jump for the equipment. */
  stepKg: number;
  /** Working sets of the previous comparable session. */
  previous: readonly ProgressionSet[];
}

/** Why the suggestion was made: a translation key plus its numbers, so the UI can say it in any language. */
export interface Reason {
  key: MessageKey;
  params: Record<string, number>;
}

export type Progression =
  | { kind: "increase"; fromKg: number; toKg: number; reason: Reason }
  | { kind: "hold"; weightKg: number; reason: Reason }
  | { kind: "build"; weightKg: number; targetReps: number; reason: Reason };

const round05 = (value: number): number => Math.round(value * 2) / 2;

/**
 * Double progression: stay at a weight until every set reaches the top of the rep range with
 * controlled effort, then suggest the next weight. This only returns a suggestion: weights are
 * never changed automatically.
 */
export function suggestProgression(input: ProgressionInput): Progression | null {
  const sets = input.previous.filter(
    (s): s is { weightKg: number; reps: number; rir: number | null } => s.weightKg !== null && s.reps !== null && s.weightKg > 0 && s.reps > 0,
  );
  if (sets.length === 0) return null;

  const topWeight = Math.max(...sets.map((s) => s.weightKg));
  const atTop = sets.filter((s) => s.weightKg === topWeight);
  const needed = Math.max(1, input.targetSets - 1);
  const allAtTopOfRange = atTop.length >= needed && atTop.every((s) => s.reps >= input.repMax);

  if (allAtTopOfRange) {
    const grinding = atTop.some((s) => s.rir !== null && s.rir < input.rirMin);
    if (grinding) {
      return {
        kind: "hold",
        weightKg: topWeight,
        reason: { key: "progression.hold", params: { reps: input.repMax, kg: topWeight } },
      };
    }
    return {
      kind: "increase",
      fromKg: topWeight,
      toKg: round05(topWeight + input.stepKg),
      reason: { key: "progression.increase", params: { reps: input.repMax } },
    };
  }

  const lowest = Math.min(...atTop.map((s) => s.reps));
  const targetReps = Math.min(input.repMax, Math.max(lowest + 1, input.repMin));
  return {
    kind: "build",
    weightKg: topWeight,
    targetReps,
    reason: { key: "progression.build", params: { kg: topWeight, reps: targetReps } },
  };
}
