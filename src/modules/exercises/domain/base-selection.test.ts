import { describe, expect, it } from "vitest";
import { BASE_EXERCISES } from "@/data/starter/base-exercises";
import { EXERCISE_CATALOG } from "@/data/starter/exercise-catalog";
import { MUSCLE_GROUPS, type MuscleGroup } from "@/lib/db/schema/enums";
import { MIN_PER_MUSCLE, normalizeName, selectBaseExercises, type ExistingExercise } from "./base-selection";

const countBy = (items: readonly { primaryMuscle: MuscleGroup }[], muscle: MuscleGroup): number => items.filter((i) => i.primaryMuscle === muscle).length;

describe("the reserve of base exercises", () => {
  it("has at least 20 exercises for every muscle group", () => {
    for (const muscle of MUSCLE_GROUPS) expect(countBy(BASE_EXERCISES, muscle)).toBeGreaterThanOrEqual(MIN_PER_MUSCLE);
  });

  it("has unique slugs and unique names, and never repeats a starter-routine exercise", () => {
    const slugs = BASE_EXERCISES.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    const names = BASE_EXERCISES.map((e) => normalizeName(e.name));
    expect(new Set(names).size).toBe(names.length);
    const starter = new Set(EXERCISE_CATALOG.map((e) => normalizeName(e.name)));
    expect(names.filter((n) => starter.has(n))).toEqual([]);
  });

  it("gives every exercise a Spanish name, sensible rep ranges and no repeated secondary muscle", () => {
    for (const e of BASE_EXERCISES) {
      expect(e.nameEs.trim()).not.toBe("");
      expect(e.defaultRepMin).toBeLessThan(e.defaultRepMax);
      expect(e.secondaryMuscles).not.toContain(e.primaryMuscle);
      expect(new Set(e.secondaryMuscles).size).toBe(e.secondaryMuscles.length);
    }
  });
});

describe("selectBaseExercises", () => {
  it("fills every muscle up to 20 from an empty database", () => {
    const chosen = selectBaseExercises(BASE_EXERCISES, []);
    for (const muscle of MUSCLE_GROUPS) expect(countBy(chosen, muscle)).toBe(MIN_PER_MUSCLE);
  });

  it("adds nothing for a muscle that is already covered", () => {
    const existing: ExistingExercise[] = Array.from({ length: 25 }, (_, i) => ({ slug: `lib-${i}`, name: `Library chest ${i}`, primaryMuscle: "chest" }));
    const chosen = selectBaseExercises(BASE_EXERCISES, existing);
    expect(countBy(chosen, "chest")).toBe(0);
    expect(countBy(chosen, "back")).toBe(MIN_PER_MUSCLE);
  });

  it("only tops up what is missing", () => {
    const existing: ExistingExercise[] = Array.from({ length: 14 }, (_, i) => ({ slug: `lib-${i}`, name: `Library calf ${i}`, primaryMuscle: "calves" }));
    expect(countBy(selectBaseExercises(BASE_EXERCISES, existing), "calves")).toBe(6);
  });

  it("skips an exercise whose name already exists, even with other capitalisation", () => {
    const existing: ExistingExercise[] = [{ slug: "lib-x", name: "barbell BENCH press", primaryMuscle: "chest" }];
    const chosen = selectBaseExercises(BASE_EXERCISES, existing);
    expect(chosen.some((e) => e.name === "Barbell Bench Press")).toBe(false);
    expect(countBy(chosen, "chest")).toBe(MIN_PER_MUSCLE - 1);
  });

  it("is idempotent: once added, running again adds nothing", () => {
    const first = selectBaseExercises(BASE_EXERCISES, []);
    const existing: ExistingExercise[] = first.map((e) => ({ slug: e.slug, name: e.name, primaryMuscle: e.primaryMuscle }));
    expect(selectBaseExercises(BASE_EXERCISES, existing)).toEqual([]);
  });

  it("does not count archived exercises towards the minimum", () => {
    const existing: ExistingExercise[] = Array.from({ length: 30 }, (_, i) => ({ slug: `old-${i}`, name: `Old ${i}`, primaryMuscle: "forearms", archived: true }));
    expect(countBy(selectBaseExercises(BASE_EXERCISES, existing), "forearms")).toBe(MIN_PER_MUSCLE);
  });
});
