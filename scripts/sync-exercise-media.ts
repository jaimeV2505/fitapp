/**
 * pnpm media:sync
 * Matches the built-in exercises to the public-domain free-exercise-db dataset, verifies that the
 * photos exist, and writes src/data/starter/exercise-media.json (images + instructions).
 * Then run `pnpm db:seed` (or restart the container) to copy them into the database.
 *
 * Source: https://github.com/yuhonas/free-exercise-db (Unlicense / public domain)
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { EXERCISE_CATALOG } from "../src/data/starter/exercise-catalog";

const DATASET_URL = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const IMAGE_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";
const OUTPUT = resolve(__dirname, "../src/data/starter/exercise-media.json");

interface DatasetExercise {
  id: string;
  name: string;
  category: string;
  images: string[];
  instructions: string[];
}

/** Preferred dataset ids per slug (first one that exists wins). `query` drives the fuzzy fallback. */
const CANDIDATES: Record<string, { ids: string[]; query?: string }> = {
  "incline-press": { ids: ["Barbell_Incline_Bench_Press_-_Medium_Grip", "Incline_Dumbbell_Press"] },
  "machine-flat-chest-press": { ids: ["Machine_Bench_Press", "Leverage_Chest_Press"] },
  "pec-deck-cable-fly": { ids: ["Butterfly", "Cable_Crossover", "Cable_Fly"], query: "butterfly pec deck" },
  "shoulder-press": { ids: ["Dumbbell_Shoulder_Press", "Machine_Shoulder_(Military)_Press", "Barbell_Shoulder_Press"] },
  "lateral-raise": { ids: ["Side_Lateral_Raise", "Cable_Seated_Lateral_Raise"] },
  "reverse-pec-deck": { ids: ["Reverse_Machine_Flyes", "Bent_Over_Dumbbell_Rear_Delt_Raise_With_Head_On_Bench"], query: "reverse machine flyes" },
  "rope-triceps-pushdown": { ids: ["Triceps_Pushdown_-_Rope_Attachment"] },
  "overhead-cable-triceps-extension": { ids: ["Cable_Rope_Overhead_Triceps_Extension", "Standing_Low-Pulley_One-Arm_Triceps_Extension"] },
  "lat-pulldown": { ids: ["Wide-Grip_Lat_Pulldown", "Close-Grip_Front_Lat_Pulldown"] },
  "chest-supported-row": { ids: ["Incline_Bench_Pull", "Lying_T-Bar_Row", "Incline_Dumbbell_Row"], query: "incline bench pull row" },
  "single-arm-row": { ids: ["One-Arm_Dumbbell_Row", "One_Arm_Dumbbell_Row"] },
  "straight-arm-pulldown": { ids: ["Straight-Arm_Pulldown"] },
  "seated-row": { ids: ["Seated_Cable_Rows", "Seated_Cable_Row"] },
  "preacher-curl": { ids: ["Preacher_Curl", "Machine_Preacher_Curls"] },
  "hammer-curl": { ids: ["Hammer_Curls", "Alternate_Hammer_Curl"] },
  "cable-curl": { ids: ["Standing_Biceps_Cable_Curl", "Cable_Hammer_Curls_-_Rope_Attachment"] },
  "ez-bar-curl": { ids: ["EZ-Bar_Curl", "Close-Grip_EZ-Bar_Curl", "Barbell_Curl"] },
  "hack-squat": { ids: ["Hack_Squat", "Barbell_Hack_Squat"] },
  "leg-press": { ids: ["Leg_Press"] },
  "bulgarian-split-squat": { ids: ["Split_Squat_with_Dumbbells", "Single_Leg_Squat"], query: "split squat dumbbells" },
  "leg-extension": { ids: ["Leg_Extensions"] },
  "leg-curl": { ids: ["Lying_Leg_Curls", "Seated_Leg_Curl"] },
  "seated-leg-curl": { ids: ["Seated_Leg_Curl"] },
  "romanian-deadlift": { ids: ["Romanian_Deadlift", "Romanian_Deadlift_from_Deficit"] },
  "hip-thrust": { ids: ["Barbell_Hip_Thrust"] },
  "adductor-machine": { ids: ["Thigh_Adductor", "Adductor_Machine"], query: "thigh adductor" },
  "calf-raise": { ids: ["Standing_Calf_Raises", "Calf_Press_On_The_Leg_Press_Machine"] },
};

const STOP = new Set(["with", "the", "a", "an", "on", "to", "of", "-"]);
const tokens = (text: string): Set<string> =>
  new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t && !STOP.has(t)),
  );

function similarity(a: Set<string>, b: Set<string>): number {
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  return shared / Math.max(a.size, b.size, 1);
}

async function imageExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  console.log("Downloading dataset...");
  const response = await fetch(DATASET_URL);
  if (!response.ok) throw new Error(`Dataset download failed: HTTP ${response.status}`);
  const dataset = (await response.json()) as DatasetExercise[];
  const byId = new Map(dataset.map((entry) => [entry.id, entry]));
  const strength = dataset.filter((entry) => entry.category === "strength" || entry.category === "powerlifting");

  const result: Record<string, { id: string; images: string[]; instructions: string[] }> = {};
  const report: string[] = [];

  for (const exercise of EXERCISE_CATALOG) {
    const candidate = CANDIDATES[exercise.slug];
    let match = candidate?.ids.map((id) => byId.get(id)).find((entry): entry is DatasetExercise => entry !== undefined);
    let how = "exact";

    if (!match) {
      const wanted = tokens(candidate?.query ?? exercise.name);
      const ranked = strength
        .map((entry) => ({ entry, score: similarity(wanted, tokens(entry.name)) }))
        .sort((a, b) => b.score - a.score);
      const best = ranked[0];
      if (best && best.score >= 0.5) {
        match = best.entry;
        how = `fuzzy ${best.score.toFixed(2)}`;
      }
    }

    if (!match) {
      report.push(`MISSING  ${exercise.slug}`);
      continue;
    }
    const images = match.images.map((path) => `${IMAGE_BASE}${path}`);
    const first = images[0];
    const reachable = first ? await imageExists(first) : false;
    result[exercise.slug] = { id: match.id, images, instructions: match.instructions.filter((s) => s.trim() !== "") };
    report.push(`${reachable ? "ok      " : "NO IMAGE"} ${exercise.slug.padEnd(34)} -> ${match.id} (${how})`);
  }

  writeFileSync(OUTPUT, `${JSON.stringify(result, null, 2)}\n`);
  console.log(report.join("\n"));
  console.log(`\nWrote ${Object.keys(result).length}/${EXERCISE_CATALOG.length} entries to ${OUTPUT}`);
  console.log("Review any fuzzy/MISSING lines, then run: pnpm db:seed");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
