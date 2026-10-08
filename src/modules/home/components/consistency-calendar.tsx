"use client";

import { Card } from "@/components/ui/card";
import { useIntlLocale, useT } from "@/lib/i18n/client";
import { isoWeekdayLabel } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { Consistency } from "../service";
import { WEEKDAY_DISC } from "./plate-colors";
import { StreakBadge } from "./streak-badge";

const ROWS = [1, 2, 3, 4, 5, 6, 7] as const;

/** The last 12 weeks as a grid: a column per week, a row per weekday. A trained day takes its weekday's plate colour. */
export function ConsistencyCalendar({ data }: { data: Consistency }) {
  const t = useT();
  const intl = useIntlLocale();

  return (
    <Card className="p-5">
      <h2 className="mb-1 text-lg font-semibold">{t("consistency.title")}</h2>
      <p className="mb-4 text-sm text-muted-foreground">{t("consistency.hint")}</p>

      <StreakBadge streak={data.streak} className="mb-4" />

      <div role="img" aria-label={t("consistency.aria", { count: data.totalDays })} className="grid grid-cols-[1rem_repeat(12,minmax(0,1fr))] gap-1">
        {ROWS.map((weekday) => (
          <div key={weekday} className="contents">
            <span aria-hidden className="flex items-center text-[0.65rem] font-semibold uppercase text-muted-foreground">
              {isoWeekdayLabel(weekday, "short", intl).charAt(0)}
            </span>
            {data.calendar.map((week) => {
              const cell = week.cells[weekday - 1];
              if (!cell) return <span key={week.weekStart} />;
              return (
                <span
                  key={cell.date}
                  className={cn(
                    "aspect-square rounded-[5px] border",
                    cell.state === "done" && cn(WEEKDAY_DISC[cell.weekday], "border-black/15"),
                    cell.state === "today" && "border-primary bg-primary/15",
                    cell.state === "past" && "border-transparent bg-muted/70",
                    cell.state === "future" && "border-dashed border-border/70",
                  )}
                />
              );
            })}
          </div>
        ))}
      </div>

      <p className="tnum mt-3 text-center text-sm text-muted-foreground">{t("consistency.total", { count: data.totalDays })}</p>
    </Card>
  );
}
