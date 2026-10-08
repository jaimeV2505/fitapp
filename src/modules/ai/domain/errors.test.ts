import { describe, expect, it } from "vitest";
import { classifyAiError, statusOf } from "./errors";

describe("classifyAiError", () => {
  it("recognises a rejected key", () => {
    expect(classifyAiError({ status: 401, message: "invalid x-api-key" })).toBe("auth");
    expect(classifyAiError({ status: 403, message: "forbidden" })).toBe("auth");
  });

  it("recognises a missing model", () => {
    expect(classifyAiError({ status: 404, message: "model: claude-x" })).toBe("model");
    expect(classifyAiError({ message: "The model does not exist" })).toBe("model");
  });

  it("recognises an account without credit, even though the status is 400", () => {
    expect(classifyAiError({ status: 400, message: "Your credit balance is too low to access the API" })).toBe("credit");
  });

  it("recognises a busy service", () => {
    expect(classifyAiError({ status: 429, message: "rate limit" })).toBe("busy");
    expect(classifyAiError({ status: 529, message: "Overloaded" })).toBe("busy");
  });

  it("falls back to other", () => {
    expect(classifyAiError({ message: "The model did not return a structured estimate." })).toBe("other");
    expect(classifyAiError({ status: 500, message: "boom" })).toBe("other");
    expect(classifyAiError({})).toBe("other");
  });
});

describe("statusOf", () => {
  it("reads a numeric status and ignores anything else", () => {
    expect(statusOf({ status: 401 })).toBe(401);
    expect(statusOf({ status: "401" })).toBeUndefined();
    expect(statusOf(new Error("x"))).toBeUndefined();
    expect(statusOf(null)).toBeUndefined();
  });
});
