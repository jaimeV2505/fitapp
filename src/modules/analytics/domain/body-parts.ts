import type { MuscleGroup } from "@/lib/db/schema/enums";

type Vec3 = readonly [number, number, number];

export interface BodyPart {
  /** The muscle group this part belongs to, or null for neutral anatomy (head, joints, feet...). */
  muscle: MuscleGroup | null;
  /** Centre in metres: x to the person's left (+), y up, z forward. The body stands on y = -0.925. */
  position: Vec3;
  /** Radii of the ellipsoid along x, y, z. */
  radii: Vec3;
  /** Rotation in radians. */
  rotation?: Vec3;
  /** Also draw the mirror image on the other side (x and the roll flipped). */
  mirror?: boolean;
}

/**
 * A stylised body made of ellipsoids: the 3D view that works with no model file. Muscles sit slightly proud of the
 * neutral core so they read as separate shapes, front and back. A real anatomy model replaces all of this.
 */
export const BODY_PARTS: readonly BodyPart[] = [
  // neutral anatomy
  { muscle: null, position: [0, 0.78, 0], radii: [0.095, 0.12, 0.1] },
  { muscle: null, position: [0, 0.675, 0], radii: [0.045, 0.05, 0.045] },
  { muscle: null, position: [0, 0.36, 0], radii: [0.185, 0.27, 0.092] },
  { muscle: null, position: [0, 0.06, 0], radii: [0.17, 0.11, 0.1] },
  { muscle: null, position: [0.262, 0.4, 0], radii: [0.03, 0.12, 0.03], mirror: true },
  { muscle: null, position: [0.29, 0.21, 0], radii: [0.026, 0.12, 0.026], mirror: true },
  { muscle: null, position: [0.305, 0.07, 0], radii: [0.03, 0.05, 0.02], mirror: true },
  { muscle: null, position: [0.09, -0.27, 0], radii: [0.06, 0.19, 0.055], mirror: true },
  { muscle: null, position: [0.088, -0.64, 0], radii: [0.04, 0.17, 0.04], mirror: true },
  { muscle: null, position: [0.09, -0.9, 0.04], radii: [0.04, 0.025, 0.08], mirror: true },
  // upper body
  { muscle: "chest", position: [0.088, 0.47, 0.062], radii: [0.092, 0.07, 0.055], mirror: true },
  { muscle: "shoulders", position: [0.215, 0.56, 0], radii: [0.07, 0.07, 0.07], mirror: true },
  { muscle: "back", position: [0.095, 0.45, -0.07], radii: [0.1, 0.13, 0.05], mirror: true },
  { muscle: "back", position: [0.125, 0.34, -0.05], radii: [0.07, 0.12, 0.05], mirror: true },
  { muscle: "back", position: [0, 0.6, -0.055], radii: [0.11, 0.05, 0.045] },
  { muscle: "biceps", position: [0.262, 0.4, 0.032], radii: [0.036, 0.1, 0.036], rotation: [0, 0, -0.08], mirror: true },
  { muscle: "triceps", position: [0.262, 0.4, -0.03], radii: [0.036, 0.1, 0.034], rotation: [0, 0, -0.08], mirror: true },
  { muscle: "forearms", position: [0.29, 0.21, 0], radii: [0.034, 0.115, 0.034], rotation: [0, 0, -0.07], mirror: true },
  { muscle: "core", position: [0, 0.27, 0.075], radii: [0.095, 0.12, 0.04] },
  { muscle: "core", position: [0.125, 0.27, 0.03], radii: [0.03, 0.1, 0.055], mirror: true },
  // lower body
  { muscle: "glutes", position: [0.07, -0.02, -0.075], radii: [0.085, 0.08, 0.07], mirror: true },
  { muscle: "quads", position: [0.092, -0.27, 0.03], radii: [0.075, 0.19, 0.07], mirror: true },
  { muscle: "hamstrings", position: [0.092, -0.27, -0.045], radii: [0.07, 0.18, 0.06], mirror: true },
  { muscle: "adductors", position: [0.045, -0.25, 0], radii: [0.038, 0.15, 0.05], mirror: true },
  { muscle: "calves", position: [0.088, -0.64, -0.03], radii: [0.05, 0.13, 0.05], mirror: true },
];

/** Writes out both sides of every mirrored part. */
export function expandParts(parts: readonly BodyPart[]): BodyPart[] {
  return parts.flatMap((part) => {
    if (!part.mirror) return [part];
    const [x, y, z] = part.position;
    const [rx, ry, rz] = part.rotation ?? [0, 0, 0];
    return [
      { ...part, mirror: false },
      { ...part, mirror: false, position: [-x, y, z] as Vec3, rotation: [rx, ry, -rz] as Vec3 },
    ];
  });
}
