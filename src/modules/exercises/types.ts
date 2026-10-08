import type { Equipment, MuscleGroup } from "@/lib/db/schema/enums";

export interface HistorySetRow {
  sessionId: string;
  localDate: string;
  weightKg: number | null;
  reps: number | null;
}

/** One finished session of one exercise, reduced to the numbers worth charting. */
export interface ExerciseHistoryPoint {
  sessionId: string;
  localDate: string;
  sets: number;
  /** Heaviest weight lifted in a completed working set. */
  topWeightKg: number | null;
  /** Reps done at the top weight. */
  repsAtTopWeight: number | null;
  totalVolumeKg: number;
  /** Estimated one-rep max (Epley) from the best set. Null when it cannot be estimated reliably. */
  estimated1RmKg: number | null;
}

export interface ExerciseRecords {
  maxWeightKg: number | null;
  bestEstimated1RmKg: number | null;
  bestSessionVolumeKg: number | null;
}

export interface ExerciseDetail {
  id: string;
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment | null;
  imageUrls: string[];
  instructions: string[];
  history: ExerciseHistoryPoint[];
  records: ExerciseRecords;
}

export interface ExerciseListItem {
  id: string;
  name: string;
  primaryMuscle: MuscleGroup;
  equipment: Equipment | null;
  imageUrl: string | null;
}
