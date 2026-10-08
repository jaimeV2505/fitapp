import type { Equipment, MuscleGroup, SessionStatus } from "@/lib/db/schema/enums";
import type { ExerciseBests, RecordKind } from "./domain/records";

/** Serializable view models passed from server to client components. No Date objects, no numeric strings. */

export interface SetView {
  id: string;
  setNumber: number;
  isWarmup: boolean;
  weightKg: number | null;
  reps: number | null;
  rir: number | null;
  completed: boolean;
  completedAt: string | null;
}

export interface PreviousSet {
  weightKg: number | null;
  reps: number | null;
  rir: number | null;
}

export interface PreviousPerformance {
  /** YYYY-MM-DD of the session this comes from. */
  localDate: string;
  sets: PreviousSet[];
}

export interface ExerciseSessionView {
  id: string;
  exerciseId: string | null;
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment | null;
  /** Demo photos (start/end position). Empty when none are available. */
  imageUrls: string[];
  /** Best results from earlier finished sessions. Null when this exercise has no history yet. */
  bests: ExerciseBests | null;
  position: number;
  targetSets: number;
  repMin: number;
  repMax: number;
  rirMin: number;
  rirMax: number;
  allowFailureOnLastSet: boolean;
  restSeconds: number;
  sets: SetView[];
  previous: PreviousPerformance | null;
}

export interface SessionView {
  id: string;
  name: string;
  focus: string;
  status: SessionStatus;
  startedAt: string;
  completedAt: string | null;
  localDate: string;
  exercises: ExerciseSessionView[];
}

export interface SessionSummary {
  id: string;
  name: string;
  focus: string;
  localDate: string;
  completedAt: string | null;
  status: SessionStatus;
  completedSets: number;
  totalVolumeKg: number;
  exerciseCount: number;
}

export interface PlanDayOverview {
  id: string;
  name: string;
  focus: string;
  weekday: number | null;
  exerciseCount: number;
  totalSets: number;
  /** Photos of the first exercises, for the dashboard hero. */
  previewImages: string[];
  /** Primary muscles trained that day, in plan order, without duplicates. */
  muscles: MuscleGroup[];
}

/** Input of the single "save this set" mutation used by the logger and its offline queue. */
export interface SaveSetInput {
  setId: string;
  weightKg: number | null;
  reps: number | null;
  rir: number | null;
  completed: boolean;
  /** ISO timestamp from the device, so retried requests keep the real completion time. */
  completedAt: string | null;
}

/** One exercise of a plan day, as shown in the weekly routine view. */
export interface DayPreviewItem {
  exerciseId: string;
  name: string;
  imageUrl: string | null;
  primaryMuscle: MuscleGroup;
  equipment: Equipment | null;
  sets: number;
  repMin: number;
  repMax: number;
  rirMin: number;
  rirMax: number;
  allowFailureOnLastSet: boolean;
}

export interface PlanDayDetail extends PlanDayOverview {
  items: DayPreviewItem[];
}

export interface RecordSummary {
  id: string;
  kind: RecordKind;
  exerciseName: string;
  valueKg: number;
  /** YYYY-MM-DD in the user's timezone. */
  localDate: string;
}
