/**
 * Date helpers. "Local date" always means the calendar date in the user's timezone,
 * as a YYYY-MM-DD string. Pure functions: no I/O, easy to test.
 */

export function localDateString(date: Date, timeZone: string): string {
  // The en-CA locale formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

const WEEKDAY_INDEX: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

/** ISO weekday (1 = Monday ... 7 = Sunday) of an instant in the given timezone. */
export function isoWeekday(date: Date, timeZone: string): number {
  const short = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(date);
  return WEEKDAY_INDEX[short] ?? 1;
}

export function hourInTimeZone(date: Date, timeZone: string): number {
  const hour = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", hour12: false }).format(date);
  return Number.parseInt(hour, 10) % 24;
}

/** "Mon"/"Monday" (or Lun/Lunes) for an ISO weekday 1..7, in the given language. */
export function isoWeekdayLabel(weekday: number, style: "short" | "long", locale = "en-US"): string {
  // 2024-01-01 was a Monday, so day N of January 2024 is ISO weekday N.
  const date = new Date(Date.UTC(2024, 0, Math.min(7, Math.max(1, weekday))));
  const label = new Intl.DateTimeFormat(locale, { timeZone: "UTC", weekday: style }).format(date).replace(/\.$/, "");
  return label.charAt(0).toLocaleUpperCase(locale) + label.slice(1);
}

/** Which greeting to show for an hour of the day (the text itself comes from the translations). */
export type Greeting = "night" | "morning" | "afternoon" | "evening";

export function greetingFor(hour: number): Greeting {
  if (hour < 5) return "night";
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

export function weekdayName(date: Date, timeZone: string, locale = "en-US"): string {
  return new Intl.DateTimeFormat(locale, { timeZone, weekday: "long" }).format(date);
}

/** Add whole days to a YYYY-MM-DD string (calendar arithmetic, timezone independent). */
export function addDays(localDate: string, days: number): string {
  const [y, m, d] = localDate.split("-").map(Number);
  const base = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

/** ISO weekday (1..7) of a YYYY-MM-DD string. */
export function isoWeekdayOfLocalDate(localDate: string): number {
  const [y, m, d] = localDate.split("-").map(Number);
  const day = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1)).getUTCDay(); // 0 = Sunday
  return day === 0 ? 7 : day;
}

/** Inclusive start and end (YYYY-MM-DD) of the week containing `localDate`. */
export function weekRange(localDate: string, weekStartsOn: number): { start: string; end: string } {
  const weekday = isoWeekdayOfLocalDate(localDate);
  const offset = (weekday - weekStartsOn + 7) % 7;
  const start = addDays(localDate, -offset);
  return { start, end: addDays(start, 6) };
}

export function formatShortDate(localDate: string, locale = "en-US"): string {
  const [y, m, d] = localDate.split("-").map(Number);
  const date = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
  return new Intl.DateTimeFormat(locale, { timeZone: "UTC", month: "short", day: "numeric" }).format(date);
}

/** "Thursday, October 8" for a YYYY-MM-DD string. */
export function formatLongDate(localDate: string, locale = "en-US"): string {
  const [y, m, d] = localDate.split("-").map(Number);
  const date = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
  return new Intl.DateTimeFormat(locale, { timeZone: "UTC", weekday: "long", month: "long", day: "numeric" }).format(date);
}
