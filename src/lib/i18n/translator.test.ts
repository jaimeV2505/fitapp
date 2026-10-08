import { describe, expect, it } from "vitest";
import { createTranslator } from "./translator";
import { en } from "./messages/en";
import { es } from "./messages/es";

describe("createTranslator with the real dictionaries", () => {
  const tEn = createTranslator("en", en);
  const tEs = createTranslator("es", es);

  it("translates plain keys", () => {
    expect(tEn("editor.complete")).toBe("Complete set");
    expect(tEs("editor.complete")).toBe("Completar serie");
  });

  it("applies plural rules per language", () => {
    expect(tEn("home.exercisesSets", { exercises: 1, sets: 3 })).toBe("1 exercise · 3 sets");
    expect(tEs("home.exercisesSets", { exercises: 1, sets: 3 })).toBe("1 ejercicio · 3 series");
    expect(tEs("sync.offline", { count: 2 })).toBe("Sin conexión · 2 series guardadas en este dispositivo, se sincronizarán solas");
  });

  it("fills placeholders", () => {
    expect(tEs("planner.startDay", { day: "Lunes", focus: "Empuje" })).toBe("Empezar Lunes · Empuje");
  });

  it("returns the key itself when a key is missing instead of crashing", () => {
    // @ts-expect-error deliberately wrong key
    expect(tEn("nope.missing")).toBe("nope.missing");
  });
});
