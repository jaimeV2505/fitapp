import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { LOCALE_COOKIE, isLocale, pickLocale, type Locale } from "./config";
import { localizeName } from "./names";
import { MESSAGES } from "./messages";
import { createTranslator, type Translate } from "./translator";

/** The visitor's language: the cookie set by the language switcher, else the browser's preference. */
export const getLocale = cache(async (): Promise<Locale> => {
  const stored = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(stored)) return stored;
  return pickLocale((await headers()).get("accept-language"));
});

export interface ServerI18n {
  locale: Locale;
  t: Translate;
  /** Name of a built-in exercise, food, day or template in the current language (unknown names pass through). */
  name: (value: string) => string;
}

export const getI18n = cache(async (): Promise<ServerI18n> => {
  const locale = await getLocale();
  return { locale, t: createTranslator(locale, MESSAGES[locale]), name: (value) => localizeName(value, locale) };
});

export async function getT(): Promise<Translate> {
  return (await getI18n()).t;
}
