import { describe, expect, it } from "vitest";
import { storageReady } from "./config";

describe("storageReady", () => {
  it("is always ready for local storage", () => {
    expect(storageReady("local", undefined)).toBe(true);
  });

  it("needs a token or a store id for Vercel Blob", () => {
    expect(storageReady("vercel-blob", undefined, undefined)).toBe(false);
    expect(storageReady("vercel-blob", "", "")).toBe(false);
    expect(storageReady("vercel-blob", "  ", "  ")).toBe(false);
  });

  it("accepts the static token of an older store", () => {
    expect(storageReady("vercel-blob", "vercel_blob_rw_x")).toBe(true);
  });

  it("accepts the store id of a current store (OIDC, no token)", () => {
    expect(storageReady("vercel-blob", undefined, "store_abc123")).toBe(true);
  });
});
