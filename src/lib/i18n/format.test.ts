import { describe, expect, it } from "vitest";
import { formatMessage, placeholdersOf } from "./format";

describe("formatMessage", () => {
  it("returns plain text unchanged", () => {
    expect(formatMessage("Complete set")).toBe("Complete set");
  });

  it("fills named placeholders", () => {
    expect(formatMessage("Hello, {name}!", { name: "Jaime" })).toBe("Hello, Jaime!");
    expect(formatMessage("{a} of {b}", { a: 3, b: 7 })).toBe("3 of 7");
  });

  it("chooses the plural form for English", () => {
    const template = "{count, plural, one {# set} other {# sets}}";
    expect(formatMessage(template, { count: 1 }, "en")).toBe("1 set");
    expect(formatMessage(template, { count: 3 }, "en")).toBe("3 sets");
    expect(formatMessage(template, { count: 0 }, "en")).toBe("0 sets");
  });

  it("chooses the plural form for Spanish", () => {
    const template = "{count, plural, one {# serie} other {# series}}";
    expect(formatMessage(template, { count: 1 }, "es")).toBe("1 serie");
    expect(formatMessage(template, { count: 4 }, "es")).toBe("4 series");
  });

  it("supports exact matches and surrounding text", () => {
    const template = "You have {count, plural, =0 {nothing} one {# meal} other {# meals}} today";
    expect(formatMessage(template, { count: 0 })).toBe("You have nothing today");
    expect(formatMessage(template, { count: 1 })).toBe("You have 1 meal today");
    expect(formatMessage(template, { count: 2 })).toBe("You have 2 meals today");
  });

  it("formats big numbers for the locale", () => {
    expect(formatMessage("{count, plural, other {# kg}}", { count: 12500 }, "en")).toBe("12,500 kg");
  });

  it("keeps unknown braces and survives unbalanced ones", () => {
    expect(formatMessage("a {unknown thing} b")).toBe("a {unknown thing} b");
    expect(formatMessage("broken {oops")).toBe("broken {oops");
  });
});

describe("placeholdersOf", () => {
  it("lists the placeholders, including plural counts and ones inside branches", () => {
    expect(placeholdersOf("Hi {name}")).toEqual(["name"]);
    expect(placeholdersOf("{count, plural, one {# set of {name}} other {# sets}}")).toEqual(["count", "name"]);
    expect(placeholdersOf("no placeholders")).toEqual([]);
  });
});
