import { INTL_LOCALE, type Locale } from "./config";
import { formatMessage, type MessageParams } from "./format";
import type { MessageKey, Messages } from "./types";

export type Translate = (key: MessageKey, params?: MessageParams) => string;

function lookup(messages: Messages, key: string): string | undefined {
  let node: unknown = messages;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : undefined;
}

/**
 * Builds the `t` function for a language. A missing key returns the key itself (visible in the UI and caught by
 * the tests) instead of crashing the page.
 */
export function createTranslator(locale: Locale, messages: Messages): Translate {
  const intl = INTL_LOCALE[locale];
  return (key, params) => {
    const template = lookup(messages, key);
    return template === undefined ? key : formatMessage(template, params, intl);
  };
}
