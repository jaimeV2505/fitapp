import type { MuscleGroup } from "@/lib/db/schema/enums";

/**
 * Muscle ids used by react-body-highlighter. One of our groups can cover several of its regions
 * (e.g. shoulders = front and rear deltoids; back = upper back and traps).
 */
const BODY_MUSCLES: Record<MuscleGroup, readonly string[]> = {
  chest: ["chest"],
  back: ["upper-back", "trapezius"],
  shoulders: ["front-deltoids", "back-deltoids"],
  biceps: ["biceps"],
  triceps: ["triceps"],
  forearms: ["forearm"],
  quads: ["quadriceps"],
  hamstrings: ["hamstring"],
  glutes: ["gluteal"],
  calves: ["calves"],
  adductors: ["adductor"],
  core: ["abs", "obliques"],
};

export function toBodyMuscles(group: MuscleGroup): readonly string[] {
  return BODY_MUSCLES[group];
}
