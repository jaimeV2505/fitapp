import type { Equipment, MuscleGroup } from "@/lib/db/schema/enums";

export interface PlanItemInput {
  exerciseId: string;
  exerciseName: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment | null;
  position: number;
  targetSets: number;
  repMin: number;
  repMax: number;
  targetRirMin: number;
  targetRirMax: number;
  allowFailureOnLastSet: boolean;
  restSeconds: number | null;
}

export interface SetBlueprint {
  setNumber: number;
  targetRepMin: number;
  targetRepMax: number;
}

export interface ExerciseBlueprint {
  exerciseId: string;
  position: number;
  nameSnapshot: string;
  primaryMuscleSnapshot: MuscleGroup;
  secondaryMusclesSnapshot: MuscleGroup[];
  equipmentSnapshot: Equipment | null;
  targetSets: number;
  targetRepMin: number;
  targetRepMax: number;
  targetRirMin: number;
  targetRirMax: number;
  allowFailureOnLastSet: boolean;
  restSeconds: number;
  sets: SetBlueprint[];
}

/**
 * Turns plan items into the exact rows a new session will contain.
 * Everything that is displayed or analysed later is copied here, so later plan edits
 * cannot change what a past session looked like.
 */
export function buildExerciseBlueprints(items: readonly PlanItemInput[], defaultRestSeconds: number): ExerciseBlueprint[] {
  return [...items]
    .sort((a, b) => a.position - b.position)
    .map((item, index) => ({
      exerciseId: item.exerciseId,
      position: index,
      nameSnapshot: item.exerciseName,
      primaryMuscleSnapshot: item.primaryMuscle,
      secondaryMusclesSnapshot: [...item.secondaryMuscles],
      equipmentSnapshot: item.equipment,
      targetSets: item.targetSets,
      targetRepMin: item.repMin,
      targetRepMax: item.repMax,
      targetRirMin: item.targetRirMin,
      targetRirMax: item.targetRirMax,
      allowFailureOnLastSet: item.allowFailureOnLastSet,
      restSeconds: item.restSeconds ?? defaultRestSeconds,
      sets: Array.from({ length: item.targetSets }, (_, i) => ({
        setNumber: i + 1,
        targetRepMin: item.repMin,
        targetRepMax: item.repMax,
      })),
    }));
}
