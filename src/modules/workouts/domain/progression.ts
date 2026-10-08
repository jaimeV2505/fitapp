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

export type Progression =
  | { kind: "increase"; fromKg: number; toKg: number; reason: string }
  | { kind: "hold"; weightKg: number; reason: string }
  | { kind: "build"; weightKg: number; targetReps: number; reason: string };

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
        reason: `You hit ${input.repMax} reps but very close to failure. Repeat ${topWeight} kg with a rep or two in reserve first.`,
      };
    }
    return {
      kind: "increase",
      fromKg: topWeight,
      toKg: round05(topWeight + input.stepKg),
      reason: `You reached ${input.repMax} reps on every set last time.`,
    };
  }

  const lowest = Math.min(...atTop.map((s) => s.reps));
  const targetReps = Math.min(input.repMax, Math.max(lowest + 1, input.repMin));
  return {
    kind: "build",
    weightKg: topWeight,
    targetReps,
    reason: `Stay at ${topWeight} kg and aim for ${targetReps}+ reps on every set before going heavier.`,
  };
}
