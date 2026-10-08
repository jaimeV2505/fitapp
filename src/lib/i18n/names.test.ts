import { describe, expect, it } from "vitest";
import { EXERCISE_CATALOG } from "@/data/starter/exercise-catalog";
import { FOOD_CATALOG } from "@/data/starter/food-catalog";
import { STARTER_MEAL_TEMPLATES } from "@/data/starter/meal-templates";
import { STARTER_PLAN_DAYS } from "@/data/starter/workout-plan";
import { localizeName, SPANISH_NAMES } from "./names";

describe("Spanish names of the built-in content", () => {
  const missing = (names: string[]) => names.filter((n) => !(n in SPANISH_NAMES));

  it("cover every exercise of the starter routine", () => {
    expect(missing(EXERCISE_CATALOG.map((e) => e.name))).toEqual([]);
  });

  it("cover every plan day name and focus", () => {
    expect(missing(STARTER_PLAN_DAYS.flatMap((d) => [d.name, d.focus]))).toEqual([]);
  });

  it("cover every starter food and its natural piece", () => {
    expect(missing(FOOD_CATALOG.map((f) => f.name))).toEqual([]);
    expect(missing(FOOD_CATALOG.flatMap((f) => (f.pieceLabel ? [f.pieceLabel] : [])))).toEqual([]);
  });

  it("cover every meal template", () => {
    expect(missing(STARTER_MEAL_TEMPLATES.map((t) => t.name))).toEqual([]);
  });

  it("leave English and unknown names untouched", () => {
    expect(localizeName("Lat Pulldown", "en")).toBe("Lat Pulldown");
    expect(localizeName("Lat Pulldown", "es")).toBe("Jalón al pecho");
    expect(localizeName("My cable crunch", "es")).toBe("My cable crunch");
  });
});
