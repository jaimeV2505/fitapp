import { describe, expect, it } from "vitest";
import { cdnUrl } from "./images";

describe("cdnUrl", () => {
  it("rewrites the raw GitHub address of the exercise photos to the CDN", () => {
    expect(cdnUrl("https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Butterfly/0.jpg")).toBe(
      "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Butterfly/0.jpg",
    );
  });

  it("leaves any other address alone", () => {
    expect(cdnUrl("/api/food-photos/abc")).toBe("/api/food-photos/abc");
    expect(cdnUrl("https://example.com/a.jpg")).toBe("https://example.com/a.jpg");
  });
});
