"use client";

import { motion, useAnimate, useReducedMotion } from "motion/react";
import { useEffect } from "react";
import { AnimatedCheck } from "@/components/ui/animated-check";
import { Card } from "@/components/ui/card";
import { GoldPlate } from "@/components/ui/gold-plate";
import { useIntlLocale, useT } from "@/lib/i18n/client";
import type { MessageKey } from "@/lib/i18n/types";
import { spring } from "@/lib/motion";
import { isoWeekdayLabel } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { Streak } from "../domain/consistency";
import type { WheelDayState } from "../domain/week-wheel";
import type { WeekWheelData } from "../service";
import { WEEKDAY_DISC } from "./plate-colors";
import { StreakBadge } from "./streak-badge";

const STATE_LABEL: Record<WheelDayState, MessageKey> = {
  done: "wheel.done",
  today: "wheel.today",
  past: "wheel.rest",
  future: "wheel.upcoming",
};

/** The week as seven plates. Trained days light up in their plate colour; reaching the goal sends a flash across. */
export function WeekWheel({ wheel, streak }: { wheel: WeekWheelData; streak?: Streak }) {
  const t = useT();
  const intl = useIntlLocale();
  const [flashRef, animateFlash] = useAnimate<HTMLDivElement>();
  const reduceMotion = useReducedMotion();

  // The flash plays once per week (remembered in this browser), imperatively: no state, no re-render.
  useEffect(() => {
    if (!wheel.goalReached || reduceMotion || !flashRef.current) return;
    const key = `fitapp-goal-flash:${wheel.weekStart}`;
    try {
      if (window.localStorage.getItem(key)) return;
      window.localStorage.setItem(key, "1");
    } catch {
      /* storage unavailable: show it this once */
    }
    void animateFlash(flashRef.current, { x: ["-120%", "420%"], opacity: [0, 1, 1, 0] }, { duration: 1.3, ease: "easeInOut", delay: 0.5 });
  }, [wheel.goalReached, wheel.weekStart, reduceMotion, flashRef, animateFlash]);

  return (
    <Card className="relative overflow-hidden p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">{t("home.thisWeek")}</h2>
        <p className="tnum text-sm font-semibold">
          {wheel.goalReached ? (
            <span className="inline-flex items-center gap-1.5 text-gold">
              <GoldPlate size={20} label="" /> {t("wheel.goal")}
            </span>
          ) : (
            t("wheel.progress", { done: wheel.completedDays, target: wheel.target })
          )}
        </p>
      </div>

      <ol className="mt-4 grid grid-cols-7 gap-1.5 sm:gap-2">
        {wheel.days.map((day, index) => {
          const weekday = isoWeekdayLabel(day.weekday, "short", intl);
          const done = day.state === "done";
          return (
            <li key={day.date} className="flex flex-col items-center gap-1.5" aria-label={`${isoWeekdayLabel(day.weekday, "long", intl)}: ${t(STATE_LABEL[day.state])}`}>
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ ...spring.pop, delay: index * 0.05 }}
                className={cn(
                  "relative flex aspect-square w-full max-w-12 items-center justify-center rounded-full border-2",
                  done && cn(WEEKDAY_DISC[day.weekday], "border-black/15"),
                  day.state === "today" && "border-primary bg-primary/10",
                  day.state === "past" && "border-border bg-muted/50",
                  day.state === "future" && "border-dashed border-border",
                )}
              >
                {done ? (
                  <>
                    <span aria-hidden className="absolute inset-1 rounded-full border border-black/15" />
                    <AnimatedCheck className="relative size-5" strokeWidth={3.4} />
                  </>
                ) : day.state === "today" ? (
                  <span aria-hidden className="size-2.5 rounded-full bg-primary" />
                ) : null}
              </motion.span>
              <span className={cn("text-[0.7rem] font-semibold uppercase tracking-wide", day.state === "today" ? "text-foreground" : "text-muted-foreground")}>{weekday}</span>
            </li>
          );
        })}
      </ol>

      {streak && streak.current > 0 ? <StreakBadge streak={streak} className="mt-4" /> : null}

      {wheel.goalReached ? (
        <div
          ref={flashRef}
          aria-hidden
          className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-[color-mix(in_oklab,var(--gold-light)_55%,transparent)] to-transparent opacity-0"
        />
      ) : null}
    </Card>
  );
}
