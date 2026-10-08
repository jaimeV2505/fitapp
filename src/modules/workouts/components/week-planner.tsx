"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useIntlLocale, useLocalizedName, useT } from "@/lib/i18n/client";
import { equipmentLabel, muscleLabel } from "@/lib/i18n/labels";
import { ExerciseThumb } from "@/modules/exercises/components/exercise-thumb";
import { formatTarget } from "../domain/format";
import type { PlanDayDetail } from "../types";
import { DayPlates, weekdayLabel } from "./day-plates";
import { StartWorkoutButton } from "./start-workout-button";

interface WeekPlannerProps {
  days: PlanDayDetail[];
  todayDayId: string | null;
  activeSessionId: string | null;
}

/**
 * The whole week at a glance: pick a day (plates) and see its exercises before you start.
 * Selection is local state, so switching days is instant.
 */
export function WeekPlanner({ days, todayDayId, activeSessionId }: WeekPlannerProps) {
  // Hooks first: they must run in the same order on every render, before any early return.
  const t = useT();
  const name = useLocalizedName();
  const intl = useIntlLocale();
  const [selectedId, setSelectedId] = useState<string | null>(todayDayId ?? days[0]?.id ?? null);
  const selected = days.find((day) => day.id === selectedId) ?? days[0];
  if (!selected) return null;

  const isToday = selected.id === todayDayId;
  const dayName = weekdayLabel(selected, true, intl);
  const totalSets = selected.items.reduce((sum, item) => sum + item.sets, 0);

  return (
    <div className="flex flex-col gap-5">
      <DayPlates days={days} selectedId={selected.id} todayId={todayDayId} onSelect={setSelectedId} />

      <AnimatePresence mode="wait" initial={false}>
        <motion.section
          key={selected.id}
          role="tabpanel"
          aria-label={t("planner.routineOf", { day: dayName })}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.16 }}
          className="flex flex-col gap-4"
        >
          <header className="hatch rounded-2xl border border-border bg-card p-5">
            <p className="text-sm font-medium text-muted-foreground">
              {isToday ? t("planner.dayAndToday", { day: dayName }) : dayName}
            </p>
            <h2 className="display-lg mt-1">{name(selected.focus)}</h2>
            <p className="mt-1 text-muted-foreground">
              {name(selected.name)} · {t("home.exercisesSets", { exercises: selected.items.length, sets: totalSets })}
            </p>
          </header>

          <ol className="flex flex-col gap-2">
            {selected.items.map((item, index) => (
              <li key={`${item.exerciseId}-${index}`} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                <ExerciseThumb src={item.imageUrl ?? undefined} name={name(item.name)} muscle={item.primaryMuscle} className="size-14" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{name(item.name)}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {muscleLabel(t, item.primaryMuscle)}
                    {item.equipment ? ` · ${equipmentLabel(t, item.equipment)}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="tnum font-semibold">{formatTarget(item.sets, item.repMin, item.repMax)}</p>
                  <p className="tnum text-xs text-muted-foreground">
                    {t("planner.rir", { value: item.rirMin === item.rirMax ? item.rirMin : `${item.rirMin}\u2013${item.rirMax}` })}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          {activeSessionId ? (
            <Button asChild size="lg" className="w-full">
              <Link href={`/workout/${activeSessionId}`}>{t("home.resumeWorkout")}</Link>
            </Button>
          ) : (
            <StartWorkoutButton
              dayId={selected.id}
              activeSessionId={null}
              label={isToday ? t("home.startWorkout") : t("planner.startDay", { day: dayName, focus: name(selected.focus) })}
              size="lg"
              className="w-full"
            />
          )}
        </motion.section>
      </AnimatePresence>
    </div>
  );
}
