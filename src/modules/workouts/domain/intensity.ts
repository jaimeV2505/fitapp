import type { Equipment, MovementType } from "@/lib/db/schema/enums";

export interface TrainingIntensity {
  targetRirMin: number;
  targetRirMax: number;
  allowFailureOnLastSet: boolean;
}

/**
 * Training metadata derived from the owner's stated rules:
 *  - compound exercises: usually 1-2 RIR
 *  - machines / isolation: usually 0-1 RIR
 *  - the last isolation set may optionally reach technical failure
 */
export function intensityFor(exercise: { movementType: MovementType; equipment: Equipment | null }): TrainingIntensity {
  const isMachineOrIsolation = exercise.movementType === "isolation" || exercise.equipment === "machine";
  return {
    targetRirMin: isMachineOrIsolation ? 0 : 1,
    targetRirMax: isMachineOrIsolation ? 1 : 2,
    allowFailureOnLastSet: exercise.movementType === "isolation",
  };
}
