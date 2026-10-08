import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ERROR_KEYS } from "./errors";
import { placeholdersOf } from "./format";
import { en } from "./messages/en";
import { es } from "./messages/es";

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") out[path] = value;
    else Object.assign(out, flatten(value, path));
  }
  return out;
}

const EN = flatten(en as Tree);
const ES = flatten(es as Tree);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(entry) && !/\.test\.ts$/.test(entry) ? [path] : [];
  });
}

const FILES = sourceFiles(join(process.cwd(), "src")).filter((file) => !file.includes(`${join("i18n", "messages")}`));

describe("translations", () => {
  it("Spanish has exactly the keys of English", () => {
    expect(Object.keys(ES).sort()).toEqual(Object.keys(EN).sort());
  });

  it("every message uses the same placeholders in both languages", () => {
    const mismatched = Object.keys(EN).filter((key) => JSON.stringify(placeholdersOf(EN[key] ?? "")) !== JSON.stringify(placeholdersOf(ES[key] ?? "")));
    expect(mismatched).toEqual([]);
  });

  it("no message is empty", () => {
    expect(Object.entries(ES).filter(([, value]) => value.trim() === "")).toEqual([]);
  });
});

describe("message keys used in the code", () => {
  const namespaces = new Set(Object.keys(en));
  // A literal such as "workout.finish" or "nav.home" whose first segment is a real namespace.
  const KEY_LITERAL = /["'`]([a-z][A-Za-z0-9]*(?:\.[A-Za-z0-9_]+)+)["'`]/g;

  it("every literal key exists in the English dictionary", () => {
    const unknown: string[] = [];
    for (const file of FILES) {
      for (const match of readFileSync(file, "utf8").matchAll(KEY_LITERAL)) {
        const key = match[1] ?? "";
        if (namespaces.has(key.split(".")[0] ?? "") && !(key in EN)) unknown.push(`${file.replace(process.cwd(), "")}: ${key}`);
      }
    }
    expect(unknown).toEqual([]);
  });

  it("every message of every AppError has a translation", () => {
    const missing: string[] = [];
    const THROWN = /new AppError\(\s*"[a-z_]+",\s*"((?:[^"\\]|\\.)*)"/g;
    for (const file of FILES) {
      for (const match of readFileSync(file, "utf8").matchAll(THROWN)) {
        const message = match[1] ?? "";
        if (!(message in ERROR_KEYS)) missing.push(message);
      }
    }
    expect(missing).toEqual([]);
  });

  it("every entry of the error table points at a real key", () => {
    expect(Object.values(ERROR_KEYS).filter((key) => !(key in EN))).toEqual([]);
  });
});
