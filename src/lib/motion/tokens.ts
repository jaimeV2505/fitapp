/**
 * Motion tokens: the only place durations, easings and springs are defined.
 * Rules of the system: fast (most things under 250 ms), springs for things that follow a finger or
 * settle into place, easing for fades, never animate layout properties other than through Motion's
 * layout engine, and always keep the information (not just the motion) when reduced motion is on.
 */

export const duration = {
  instant: 0.08,
  fast: 0.14,
  base: 0.22,
  slow: 0.36,
} as const;

type Bezier = [number, number, number, number];

/** Cubic beziers as arrays Motion understands. */
export const ease: { out: Bezier; inOut: Bezier; in: Bezier } = {
  out: [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
  in: [0.5, 0, 0.75, 0],
};

export const spring = {
  /** Buttons, chips, small state changes. Quick and almost no overshoot. */
  snappy: { type: "spring", stiffness: 520, damping: 34, mass: 0.7 },
  /** Cards and sheets settling into place. */
  smooth: { type: "spring", stiffness: 300, damping: 30 },
  /** Layout changes (cards growing, lists reordering). */
  layout: { type: "spring", stiffness: 380, damping: 38 },
  /** One small, earned moment: a completed set, a badge appearing. */
  pop: { type: "spring", stiffness: 560, damping: 22, mass: 0.8 },
  /** Progress rings and bars. */
  gauge: { type: "spring", stiffness: 140, damping: 24 },
} as const;

export const distance = { small: 6, base: 12, large: 20 } as const;

/** Translation of reduced-motion to numbers: transforms collapse to 0 and durations stay short. */
export const REDUCED_DURATION = 0.001;
