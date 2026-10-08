import { describe, expect, it } from "vitest";
import { gramsFor, macrosFor, percentOf, resolveTemplateItems, sumMacros, type FoodNutrition } from "./macros";

const egg: FoodNutrition = { caloriesPer100: 143, proteinPer100: 12.6, carbsPer100: 0.7, fatPer100: 9.5, pieceGrams: 50 };
const rice: FoodNutrition = { caloriesPer100: 130, proteinPer100: 2.7, carbsPer100: 28.2, fatPer100: 0.3, pieceGrams: null };

describe("gramsFor", () => {
  it("returns the quantity for grams and millilitres", () => {
    expect(gramsFor(rice, 180, "g")).toBe(180);
    expect(gramsFor(rice, 300, "ml")).toBe(300);
  });

  it("multiplies pieces by the piece size, or returns null when there is none", () => {
    expect(gramsFor(egg, 3, "piece")).toBe(150);
    expect(gramsFor(rice, 1, "piece")).toBeNull();
  });
});

describe("macrosFor and sumMacros", () => {
  it("scales per-100 g values to the eaten amount", () => {
    expect(macrosFor(rice, 180)).toEqual({ calories: 234, protein: 4.9, carbs: 50.8, fat: 0.5 });
  });

  it("sums a meal", () => {
    const total = sumMacros([macrosFor(egg, 150), macrosFor(rice, 180)]);
    expect(total.calories).toBe(448.5);
    expect(total.protein).toBe(23.8);
  });

  it("sums nothing to zero", () => {
    expect(sumMacros([])).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  });
});

describe("percentOf", () => {
  it("computes a percentage and tolerates missing targets", () => {
    expect(percentOf(1400, 2800)).toBe(50);
    expect(percentOf(3000, 2800)).toBe(107);
    expect(percentOf(100, null)).toBeNull();
    expect(percentOf(100, 0)).toBeNull();
  });
});

describe("resolveTemplateItems", () => {
  const items = [
    { id: "a", optionGroup: null, isDefaultOption: true },
    { id: "water", optionGroup: "liquid", isDefaultOption: true },
    { id: "milk", optionGroup: "liquid", isDefaultOption: false },
  ];

  it("keeps ungrouped items and the default option of each group", () => {
    expect(resolveTemplateItems(items, {}).map((i) => i.id)).toEqual(["a", "water"]);
  });

  it("honours the user's choice", () => {
    expect(resolveTemplateItems(items, { liquid: "milk" }).map((i) => i.id)).toEqual(["a", "milk"]);
  });

  it("ignores an invalid choice and falls back to the default", () => {
    expect(resolveTemplateItems(items, { liquid: "nope" }).map((i) => i.id)).toEqual(["a", "water"]);
  });
});
