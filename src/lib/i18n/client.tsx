"use client";

import { createContext, useContext, useMemo } from "react";
import type { Locale } from "./config";
import { INTL_LOCALE } from "./config";
import { localizeName } from "./names";
import { createTranslator, type Translate } from "./translator";
import type { Messages } from "./types";

interface I18nValue {
  locale: Locale;
  t: Translate;
  name: (value: string) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

/** Receives the language and its dictionary from the server layout, so client components translate without a fetch. */
export function I18nProvider({ locale, messages, children }: { locale: Locale; messages: Messages; children: React.ReactNode }) {
  const value = useMemo<I18nValue>(
    () => ({ locale, t: createTranslator(locale, messages), name: (text) => localizeName(text, locale) }),
    [locale, messages],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useT must be used inside <I18nProvider>");
  return value;
}

export const useT = (): Translate => useI18n().t;
export const useLocale = (): Locale => useI18n().locale;
/** BCP 47 tag (en-US, es-ES) for Intl, toLocaleString, dates. */
export const useIntlLocale = (): string => INTL_LOCALE[useI18n().locale];
export const useLocalizedName = (): ((value: string) => string) => useI18n().name;
