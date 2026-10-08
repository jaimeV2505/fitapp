import { describe, expect, it } from "vitest";
import { buildRecentMeals, type RecentSource } from "./recent-meals";

const meal = (id: string, eatenAt: string, items: RecentSource["items"], mealType: RecentSource["mealType"] = "lunch", name: string | null = null): RecentSource => ({
  id,
  mealType,
  name,
  eatenAt,
  items,
});

const rice = { foodId: "rice", quantity: 180, unit: "g" as const };
const egg = { foodId: "egg", quantity: 3, unit: "piece" as const };
const ALL = new Set(["rice", "egg", "yogurt"]);

describe("buildRecentMeals", () => {
  it("lists meals most recent first", () => {
    const result = buildRecentMeals([meal("a", "2026-10-06T12:00:00Z", [rice]), meal("b", "2026-10-07T12:00:00Z", [egg])], ALL);
    expect(result.map((m) => m.sourceId)).toEqual(["b", "a"]);
  });

  it("shows the same meal once, counting how often it was eaten", () => {
    const result = buildRecentMeals(
      [meal("a", "2026-10-05T12:00:00Z", [rice, egg]), meal("b", "2026-10-06T12:00:00Z", [egg, rice]), meal("c", "2026-10-07T12:00:00Z", [rice, egg])],
      ALL,
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ sourceId: "c", times: 3 });
  });

  it("treats a different amount or meal type as a different meal", () => {
    const result = buildRecentMeals(
      [
        meal("a", "2026-10-05T12:00:00Z", [rice]),
        meal("b", "2026-10-06T12:00:00Z", [{ ...rice, quantity: 200 }]),
        meal("c", "2026-10-07T12:00:00Z", [rice], "dinner"),
      ],
      ALL,
    );
    expect(result).toHaveLength(3);
  });

  it("leaves out meals that cannot be repeated faithfully", () => {
    const result = buildRecentMeals(
      [
        meal("empty", "2026-10-07T12:00:00Z", []),
        meal("ai", "2026-10-07T13:00:00Z", [{ foodId: null, quantity: 120, unit: "g" }]),
        meal("gone", "2026-10-07T14:00:00Z", [rice, { foodId: "deleted", quantity: 50, unit: "g" }]),
        meal("ok", "2026-10-06T12:00:00Z", [rice]),
      ],
      ALL,
    );
    expect(result.map((m) => m.sourceId)).toEqual(["ok"]);
  });

  it("respects the limit", () => {
    const many = Array.from({ length: 10 }, (_, i) => meal(`m${i}`, `2026-10-0${(i % 9) + 1}T12:00:00Z`, [{ foodId: "rice", quantity: 100 + i, unit: "g" }]));
    expect(buildRecentMeals(many, ALL, 4)).toHaveLength(4);
  });
});
