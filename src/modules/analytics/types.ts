import type { MuscleGroup } from "@/lib/db/schema/enums";

export interface WeekTotals {
  /** YYYY-MM-DD of the first day of the week. */
  weekStart: string;
  sessions: number;
  sets: number;
  volumeKg: number;
}

export interface MuscleSets {
  muscle: MuscleGroup;
  sets: number;
}

export interface ProgressOverview {
  weeks: WeekTotals[];
  thisWeek: WeekTotals;
  /** Completed working sets per primary muscle for the current week, most trained first. */
  muscleSets: MuscleSets[];
  totalWorkouts: number;
}
