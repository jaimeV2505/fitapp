/**
 * pnpm media:library
 * Downloads the public-domain free-exercise-db dataset (873 exercises) and writes the strength-type
 * exercises, mapped to our muscle/equipment enums, to src/data/starter/exercise-library.json.
 * Then run `pnpm db:seed` to load them into the database so they show up in the Library.
 * Source: https://github.com/yuhonas/free-exercise-db (Unlicense / public domain)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Equipment, MovementType, MuscleGroup } from "../src/lib/db/schema/enums";

const DATASET_URL = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const IMAGE_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";
const OUTPUT = resolve(__dirname, "../src/data/starter/exercise-library.json");
const MEDIA = resolve(__dirname, "../src/data/starter/exercise-media.json");
const KEEP_CATEGORIES = new Set(["strength", "powerlifting", "olympic weightlifting", "strongman", "plyometrics"]);
const TARGET_PER_MUSCLE = 30;

interface DatasetExercise {
  id: string;
  name: string;
  category: string;
  mechanic: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  images: string[];
  instructions: string[];
}

const MUSCLE: Record<string, MuscleGroup> = {
  abdominals: "core",
  abductors: "glutes",
  adductors: "adductors",
  biceps: "biceps",
  calves: "calves",
  chest: "chest",
  forearms: "forearms",
  glutes: "glutes",
  hamstrings: "hamstrings",
  lats: "back",
  "lower back": "back",
  "middle back": "back",
  neck: "back",
  quadriceps: "quads",
  shoulders: "shoulders",
  traps: "back",
  triceps: "triceps",
};

const EQUIPMENT: Record<string, Equipment> = {
  barbell: "barbell",
  "e-z curl bar": "barbell",
  dumbbell: "dumbbell",
  machine: "machine",
  cable: "cable",
  "body only": "bodyweight",
};

function mapMuscles(values: string[]): MuscleGroup[] {
  return [...new Set(values.flatMap((v) => (MUSCLE[v] ? [MUSCLE[v]] : [])))];
}

async function main(): Promise<void> {
  const response = await fetch(DATASET_URL);
  if (!response.ok) throw new Error(`Dataset download failed: HTTP ${response.status}`);
  const dataset = (await response.json()) as DatasetExercise[];

  // Exercises we already ship with hand-picked photos are not duplicated.
  const already = new Set(Object.values(JSON.parse(readFileSync(MEDIA, "utf8")) as Record<string, { id: string }>).map((m) => m.id));

  const result = dataset
    .filter((e) => KEEP_CATEGORIES.has(e.category) && !already.has(e.id) && e.images.length > 0)
    .flatMap((e) => {
      const [primary, ...rest] = mapMuscles(e.primaryMuscles);
      if (!primary) return [];
      const secondary = [...new Set([...rest, ...mapMuscles(e.secondaryMuscles)])].filter((m) => m !== primary);
      const movementType: MovementType = e.mechanic === "isolation" ? "isolation" : "compound";
      return [
        {
          slug: `lib-${e.id}`,
          name: e.name,
          primaryMuscle: primary,
          secondaryMuscles: secondary,
          movementType,
          equipment: e.equipment ? (EQUIPMENT[e.equipment] ?? "other") : null,
          images: e.images.map((path) => `${IMAGE_BASE}${path}`),
          instructions: e.instructions.filter((s) => s.trim() !== ""),
        },
      ];
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  writeFileSync(OUTPUT, `${JSON.stringify(result)}\n`);

  // The 27 exercises of your routine are shipped separately, so add them to the per-muscle count.
  const counts = new Map<string, number>();
  for (const e of result) counts.set(e.primaryMuscle, (counts.get(e.primaryMuscle) ?? 0) + 1);
  console.log(`Wrote ${result.length} exercises to ${OUTPUT}\n`);
  console.log("Exercises per primary muscle (library only):");
  for (const [muscle, count] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${muscle.padEnd(12)} ${String(count).padStart(4)}${count < TARGET_PER_MUSCLE ? `   (< ${TARGET_PER_MUSCLE}: the dataset has few of these; create your own in Edit routine)` : ""}`);
  }
  console.log("\nNext: pnpm db:seed");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
