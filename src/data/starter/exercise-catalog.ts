import type { Equipment, MovementType, MuscleGroup } from "@/lib/db/schema/enums";

export interface CatalogExercise {
  slug: string;
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  movementType: MovementType;
  /** Null when the exercise name does not say which equipment is used. Editable later. */
  equipment: Equipment | null;
  defaultSets: number;
  defaultRepMin: number;
  defaultRepMax: number;
}

/** Built-in exercises, shared by all users. Seed data: never imported by UI components. */
export const EXERCISE_CATALOG: readonly CatalogExercise[] = [
  // Chest
  { slug: "incline-press", name: "Incline Press", primaryMuscle: "chest", secondaryMuscles: ["shoulders", "triceps"], movementType: "compound", equipment: null, defaultSets: 4, defaultRepMin: 6, defaultRepMax: 8 },
  { slug: "machine-flat-chest-press", name: "Machine Flat Chest Press", primaryMuscle: "chest", secondaryMuscles: ["triceps", "shoulders"], movementType: "compound", equipment: "machine", defaultSets: 3, defaultRepMin: 8, defaultRepMax: 10 },
  { slug: "pec-deck-cable-fly", name: "Pec Deck / Cable Fly", primaryMuscle: "chest", secondaryMuscles: [], movementType: "isolation", equipment: "machine", defaultSets: 3, defaultRepMin: 10, defaultRepMax: 15 },
  // Shoulders
  { slug: "shoulder-press", name: "Shoulder Press", primaryMuscle: "shoulders", secondaryMuscles: ["triceps"], movementType: "compound", equipment: null, defaultSets: 3, defaultRepMin: 6, defaultRepMax: 10 },
  { slug: "lateral-raise", name: "Lateral Raise", primaryMuscle: "shoulders", secondaryMuscles: [], movementType: "isolation", equipment: null, defaultSets: 3, defaultRepMin: 12, defaultRepMax: 20 },
  { slug: "reverse-pec-deck", name: "Reverse Pec Deck", primaryMuscle: "shoulders", secondaryMuscles: ["back"], movementType: "isolation", equipment: "machine", defaultSets: 3, defaultRepMin: 12, defaultRepMax: 20 },
  // Triceps
  { slug: "rope-triceps-pushdown", name: "Rope Triceps Pushdown", primaryMuscle: "triceps", secondaryMuscles: [], movementType: "isolation", equipment: "cable", defaultSets: 3, defaultRepMin: 8, defaultRepMax: 12 },
  { slug: "overhead-cable-triceps-extension", name: "Overhead Cable Triceps Extension", primaryMuscle: "triceps", secondaryMuscles: [], movementType: "isolation", equipment: "cable", defaultSets: 3, defaultRepMin: 10, defaultRepMax: 15 },
  // Back
  { slug: "lat-pulldown", name: "Lat Pulldown", primaryMuscle: "back", secondaryMuscles: ["biceps"], movementType: "compound", equipment: "cable", defaultSets: 3, defaultRepMin: 6, defaultRepMax: 10 },
  { slug: "chest-supported-row", name: "Chest Supported Row", primaryMuscle: "back", secondaryMuscles: ["biceps"], movementType: "compound", equipment: null, defaultSets: 3, defaultRepMin: 8, defaultRepMax: 10 },
  { slug: "single-arm-row", name: "Single Arm Row", primaryMuscle: "back", secondaryMuscles: ["biceps"], movementType: "compound", equipment: null, defaultSets: 3, defaultRepMin: 8, defaultRepMax: 12 },
  { slug: "straight-arm-pulldown", name: "Straight Arm Pulldown", primaryMuscle: "back", secondaryMuscles: [], movementType: "isolation", equipment: "cable", defaultSets: 2, defaultRepMin: 12, defaultRepMax: 15 },
  { slug: "seated-row", name: "Seated Row", primaryMuscle: "back", secondaryMuscles: ["biceps"], movementType: "compound", equipment: null, defaultSets: 3, defaultRepMin: 8, defaultRepMax: 12 },
  // Biceps
  { slug: "preacher-curl", name: "Preacher Curl", primaryMuscle: "biceps", secondaryMuscles: ["forearms"], movementType: "isolation", equipment: null, defaultSets: 3, defaultRepMin: 8, defaultRepMax: 12 },
  { slug: "hammer-curl", name: "Hammer Curl", primaryMuscle: "biceps", secondaryMuscles: ["forearms"], movementType: "isolation", equipment: "dumbbell", defaultSets: 3, defaultRepMin: 10, defaultRepMax: 12 },
  { slug: "cable-curl", name: "Cable Curl", primaryMuscle: "biceps", secondaryMuscles: [], movementType: "isolation", equipment: "cable", defaultSets: 3, defaultRepMin: 10, defaultRepMax: 12 },
  { slug: "ez-bar-curl", name: "EZ Bar Curl", primaryMuscle: "biceps", secondaryMuscles: ["forearms"], movementType: "isolation", equipment: "barbell", defaultSets: 3, defaultRepMin: 8, defaultRepMax: 12 },
  // Quads
  { slug: "hack-squat", name: "Hack Squat", primaryMuscle: "quads", secondaryMuscles: ["glutes"], movementType: "compound", equipment: "machine", defaultSets: 4, defaultRepMin: 6, defaultRepMax: 10 },
  { slug: "leg-press", name: "Leg Press", primaryMuscle: "quads", secondaryMuscles: ["glutes"], movementType: "compound", equipment: "machine", defaultSets: 3, defaultRepMin: 8, defaultRepMax: 12 },
  { slug: "bulgarian-split-squat", name: "Bulgarian Split Squat", primaryMuscle: "quads", secondaryMuscles: ["glutes"], movementType: "compound", equipment: null, defaultSets: 3, defaultRepMin: 8, defaultRepMax: 12 },
  { slug: "leg-extension", name: "Leg Extension", primaryMuscle: "quads", secondaryMuscles: [], movementType: "isolation", equipment: "machine", defaultSets: 2, defaultRepMin: 12, defaultRepMax: 15 },
  // Hamstrings / glutes / calves / adductors
  { slug: "leg-curl", name: "Leg Curl", primaryMuscle: "hamstrings", secondaryMuscles: [], movementType: "isolation", equipment: "machine", defaultSets: 3, defaultRepMin: 8, defaultRepMax: 12 },
  { slug: "seated-leg-curl", name: "Seated Leg Curl", primaryMuscle: "hamstrings", secondaryMuscles: [], movementType: "isolation", equipment: "machine", defaultSets: 3, defaultRepMin: 8, defaultRepMax: 12 },
  { slug: "romanian-deadlift", name: "Romanian Deadlift", primaryMuscle: "hamstrings", secondaryMuscles: ["glutes", "back"], movementType: "compound", equipment: null, defaultSets: 4, defaultRepMin: 6, defaultRepMax: 8 },
  { slug: "hip-thrust", name: "Hip Thrust", primaryMuscle: "glutes", secondaryMuscles: ["hamstrings"], movementType: "compound", equipment: null, defaultSets: 3, defaultRepMin: 8, defaultRepMax: 12 },
  { slug: "adductor-machine", name: "Adductor Machine", primaryMuscle: "adductors", secondaryMuscles: [], movementType: "isolation", equipment: "machine", defaultSets: 2, defaultRepMin: 12, defaultRepMax: 15 },
  { slug: "calf-raise", name: "Calf Raise", primaryMuscle: "calves", secondaryMuscles: [], movementType: "isolation", equipment: null, defaultSets: 3, defaultRepMin: 10, defaultRepMax: 15 },
];
