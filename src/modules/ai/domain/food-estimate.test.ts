import { describe, expect, it } from "vitest";
import { levelFromScore, normalizeEstimate, scaleItemToGrams } from "./food-estimate";

const chicken = { name: "Chicken breast", estimatedGrams: 190, calories: 310, protein: 58, carbs: 0, fat: 7, confidence: 0.8 };
const rice = { name: "Rice", estimatedGrams: 210, calories: 270, protein: 5, carbs: 58, fat: 0.6, confidence: 0.7 };

describe("normalizeEstimate", () => {
  it("recomputes totals from the items instead of trusting the model", () => {
    const estimate = normalizeEstimate({ foods: [chicken, rice], totals: { calories: 9999 } });
    expect(estimate.totals.calories).toBe(580);
    expect(estimate.totals.protein).toBe(63);
    expect(estimate.items).toHaveLength(2);
  });

  it("derives the overall confidence from the items and never exceeds the model's own rating", () => {
    expect(normalizeEstimate({ foods: [chicken, rice] }).confidence).toBe("high");
    expect(normalizeEstimate({ foods: [chicken, rice], confidence: "medium" }).confidence).toBe("medium");
    expect(normalizeEstimate({ foods: [{ ...chicken, confidence: 0.3 }] }).confidence).toBe("low");
  });

  it("caps the confidence of an item whose calories contradict its macros", () => {
    const estimate = normalizeEstimate({ foods: [{ ...chicken, calories: 900, confidence: 0.9 }] });
    expect(estimate.items[0]?.confidence).toBe(0.4);
    expect(estimate.confidence).toBe("low");
  });

  it("rejects malformed model output", () => {
    expect(() => normalizeEstimate({ foods: [] })).toThrow();
    expect(() => normalizeEstimate({ foods: [{ ...chicken, calories: -5 }] })).toThrow();
    expect(() => normalizeEstimate("not json")).toThrow();
  });
});

describe("scaleItemToGrams", () => {
  it("keeps nutrition density when the weight changes", () => {
    const item = normalizeEstimate({ foods: [rice] }).items[0]!;
    const half = scaleItemToGrams(item, 105);
    expect(half.grams).toBe(105);
    expect(half.calories).toBe(135);
    expect(half.carbs).toBe(29);
  });
});

describe("levelFromScore", () => {
  it("maps scores to levels", () => {
    expect(levelFromScore(0.9)).toBe("high");
    expect(levelFromScore(0.6)).toBe("medium");
    expect(levelFromScore(0.2)).toBe("low");
  });
});
