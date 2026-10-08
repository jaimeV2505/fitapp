
export interface StarterPlanItem {
  exerciseSlug: string;
  sets: number;
  repMin: number;
  repMax: number;
}

export interface StarterPlanDay {
  /** ISO weekday: 1 = Monday */
  weekday: number;
  name: string;
  focus: string;
  items: readonly StarterPlanItem[];
}

export const STARTER_PLAN_NAME = "Current routine";

const item = (exerciseSlug: string, sets: number, repMin: number, repMax: number): StarterPlanItem => ({
  exerciseSlug,
  sets,
  repMin,
  repMax,
});

export const STARTER_PLAN_DAYS: readonly StarterPlanDay[] = [
  {
    weekday: 1,
    name: "Push Heavy",
    focus: "Push",
    items: [
      item("incline-press", 4, 6, 8),
      item("machine-flat-chest-press", 3, 8, 10),
      item("pec-deck-cable-fly", 3, 10, 15),
      item("shoulder-press", 3, 6, 10),
      item("lateral-raise", 4, 12, 20),
      item("rope-triceps-pushdown", 3, 8, 12),
      item("overhead-cable-triceps-extension", 3, 10, 15),
    ],
  },
  {
    weekday: 2,
    name: "Pull Heavy",
    focus: "Pull",
    items: [
      item("lat-pulldown", 3, 6, 10),
      item("chest-supported-row", 3, 8, 10),
      item("single-arm-row", 3, 8, 12),
      item("straight-arm-pulldown", 2, 12, 15),
      item("reverse-pec-deck", 3, 12, 20),
      item("preacher-curl", 3, 8, 12),
      item("hammer-curl", 3, 10, 12),
    ],
  },
  {
    weekday: 3,
    name: "Legs / Quad Focus",
    focus: "Legs",
    items: [
      item("hack-squat", 4, 6, 10),
      item("leg-press", 3, 8, 12),
      item("bulgarian-split-squat", 3, 8, 12),
      item("leg-extension", 2, 12, 15),
      item("leg-curl", 3, 8, 12),
      item("adductor-machine", 2, 12, 15),
      item("calf-raise", 3, 10, 15),
    ],
  },
  {
    weekday: 4,
    name: "Upper",
    focus: "Upper Body",
    items: [
      item("incline-press", 3, 8, 10),
      item("pec-deck-cable-fly", 2, 10, 15),
      item("lat-pulldown", 3, 8, 12),
      item("seated-row", 3, 8, 12),
      item("lateral-raise", 3, 12, 20),
      item("cable-curl", 3, 10, 12),
      item("rope-triceps-pushdown", 3, 10, 12),
    ],
  },
  {
    weekday: 5,
    name: "Legs / Posterior + Shoulders + Arms",
    focus: "Legs & Arms",
    items: [
      item("romanian-deadlift", 4, 6, 8),
      item("seated-leg-curl", 3, 8, 12),
      item("hip-thrust", 3, 8, 12),
      item("hack-squat", 3, 8, 10),
      item("leg-extension", 2, 12, 15),
      item("calf-raise", 3, 10, 15),
      item("lateral-raise", 3, 15, 20),
      item("ez-bar-curl", 3, 8, 12),
      item("overhead-cable-triceps-extension", 3, 10, 15),
    ],
  },
];

// The rule lives in the workouts domain so the plan editor and the seed share one implementation.
export { intensityFor, type TrainingIntensity } from "@/modules/workouts/domain/intensity";
