import { describe, expect, it } from "vitest";
import { pickLocale } from "./config";

describe("pickLocale", () => {
  it("picks Spanish for regional Spanish variants", () => {
    expect(pickLocale("es-CO,es;q=0.9,en;q=0.8")).toBe("es");
    expect(pickLocale("es-ES")).toBe("es");
  });

  it("respects the order of preference", () => {
    expect(pickLocale("en-US,en;q=0.9,es;q=0.8")).toBe("en");
    expect(pickLocale("fr;q=0.9,es;q=0.8,en;q=0.7")).toBe("es");
    expect(pickLocale("en;q=0.5,es;q=0.9")).toBe("es");
  });

  it("falls back to English", () => {
    expect(pickLocale(null)).toBe("en");
    expect(pickLocale("")).toBe("en");
    expect(pickLocale("de-DE,fr;q=0.8")).toBe("en");
  });
});
