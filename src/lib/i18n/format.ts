export type MessageParams = Record<string, string | number>;

/** Index of the "}" that closes the "{" at `open`, or -1. Handles nested braces (plural options). */
function findClosing(text: string, open: number): number {
  let depth = 0;
  for (let i = open; i < text.length; i += 1) {
    if (text[i] === "{") depth += 1;
    else if (text[i] === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** Parses `one {# set} other {# sets}` into a map of category -> text. */
function parsePluralOptions(source: string): Map<string, string> {
  const options = new Map<string, string>();
  let i = 0;
  while (i < source.length) {
    const open = source.indexOf("{", i);
    if (open === -1) break;
    const category = source.slice(i, open).trim();
    const close = findClosing(source, open);
    if (close === -1) break;
    options.set(category, source.slice(open + 1, close));
    i = close + 1;
  }
  return options;
}

function renderPlaceholder(body: string, params: MessageParams, locale: string): string {
  const simple = /^\s*(\w+)\s*$/.exec(body);
  if (simple) {
    const value = params[simple[1] ?? ""];
    return value === undefined ? "" : String(value);
  }

  const plural = /^\s*(\w+)\s*,\s*plural\s*,([\s\S]*)$/.exec(body);
  if (plural) {
    const raw = params[plural[1] ?? ""];
    const count = typeof raw === "number" ? raw : Number(raw);
    const options = parsePluralOptions(plural[2] ?? "");
    const chosen = options.get(`=${count}`) ?? options.get(new Intl.PluralRules(locale).select(count)) ?? options.get("other") ?? "";
    return chosen.replace(/#/g, count.toLocaleString(locale));
  }

  return `{${body}}`;
}

/**
 * Fills a message template. Supports `{name}` and a small ICU subset for plurals:
 * `{count, plural, one {# set} other {# sets}}` (exact `=0 {...}` matches also work).
 */
export function formatMessage(template: string, params: MessageParams = {}, locale = "en"): string {
  let out = "";
  let i = 0;
  while (i < template.length) {
    const char = template[i];
    if (char !== "{") {
      out += char;
      i += 1;
      continue;
    }
    const close = findClosing(template, i);
    if (close === -1) {
      out += template.slice(i);
      break;
    }
    out += renderPlaceholder(template.slice(i + 1, close), params, locale);
    i = close + 1;
  }
  return out;
}

/** Names of the `{placeholders}` a template needs, including the count of a plural. Used to check translations. */
export function placeholdersOf(template: string): string[] {
  const names = new Set<string>();
  let i = 0;
  while (i < template.length) {
    if (template[i] !== "{") {
      i += 1;
      continue;
    }
    const close = findClosing(template, i);
    if (close === -1) break;
    const body = template.slice(i + 1, close);
    const match = /^\s*(\w+)\s*(?:,|$)/.exec(body);
    if (match?.[1]) names.add(match[1]);
    // placeholders nested inside plural branches
    const plural = /^\s*\w+\s*,\s*plural\s*,([\s\S]*)$/.exec(body);
    if (plural) for (const branch of parsePluralOptions(plural[1] ?? "").values()) for (const n of placeholdersOf(branch)) names.add(n);
    i = close + 1;
  }
  return [...names].sort();
}
