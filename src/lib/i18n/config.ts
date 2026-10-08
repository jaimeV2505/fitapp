export const LOCALES = ["en", "es"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "fitapp-locale";

/** Name of each language in that language (what a language switcher shows). */
export const LOCALE_LABEL: Record<Locale, string> = { en: "English", es: "Español" };

/** BCP 47 tag used for dates, numbers and plural rules. */
export const INTL_LOCALE: Record<Locale, string> = { en: "en-US", es: "es-ES" };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * Picks the best supported language from an Accept-Language header, e.g. "es-CO,es;q=0.9,en;q=0.8" -> "es".
 * Falls back to the default when nothing matches.
 */
export function pickLocale(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;
  const candidates = header
    .split(",")
    .map((part) => {
      const [tag = "", ...params] = part.trim().split(";");
      const quality = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      return { language: tag.trim().toLowerCase().split("-")[0] ?? "", q: quality ? Number(quality.slice(2)) : 1 };
    })
    .filter((c) => c.language !== "" && !Number.isNaN(c.q))
    .sort((a, b) => b.q - a.q);
  for (const { language } of candidates) if (isLocale(language)) return language;
  return DEFAULT_LOCALE;
}
