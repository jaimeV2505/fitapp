"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, ChevronDown, Info } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { AnimatedCheck } from "@/components/ui/animated-check";
import { Card } from "@/components/ui/card";
import { collapse, duration, ease, popIn, slideSwap, spring } from "@/lib/motion";
import { InkStamp } from "@/components/ui/ink-stamp";
import { Sparkline } from "@/components/ui/sparkline";
import { useIntlLocale, useLocalizedName, useT } from "@/lib/i18n/client";
import { formatShortDate } from "@/lib/time";
import { ExerciseThumb } from "@/modules/exercises/components/exercise-thumb";
import { cn } from "@/lib/utils";
import { formatTarget, formatWeight, summarizePrevious } from "../domain/format";
import { isExerciseComplete } from "../domain/metrics";
import { findActiveSet, weightStepFor, type SetDraft } from "../domain/prefill";
import { suggestProgression } from "../domain/progression";
import type { ExerciseSessionView, SetView } from "../types";
import { SetEditor } from "./set-editor";

interface ExerciseCardProps {
  exercise: ExerciseSessionView;
  expanded: boolean;
  /** True for about a second after the last set of this exercise was completed. */
  celebrating: boolean;
  /** Set that just broke a personal record. */
  recordSetId: string | null;
  /** Set that was just completed (drives the check-mark animation only for that chip). */
  completedSetId: string | null;
  onToggle: () => void;
  onSaveSet: (exercise: ExerciseSessionView, set: SetView, draft: SetDraft, completed: boolean) => void;
  onAddSet: (exercise: ExerciseSessionView) => void;
  onRemoveSet: (set: SetView) => void;
  onShowDetail: (exercise: ExerciseSessionView) => void;
  registerRef: (element: HTMLElement | null) => void;
}

export function ExerciseCard({
  exercise,
  expanded,
  celebrating,
  recordSetId,
  completedSetId,
  onToggle,
  onSaveSet,
  onAddSet,
  onRemoveSet,
  onShowDetail,
  registerRef,
}: ExerciseCardProps) {
  const t = useT();
  const localName = useLocalizedName();
  const intl = useIntlLocale();
  const exerciseName = localName(exercise.name);
  // The set being edited. Null means "the next set to do".
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  // Ignore a second tap on "Complete set" while the previous editor is still animating out.
  const lastSave = useRef({ id: "", at: 0 });

  const complete = isExerciseComplete(exercise);
  const workingSets = exercise.sets.filter((s) => !s.isWarmup);
  const doneCount = workingSets.filter((s) => s.completed).length;
  const previous = summarizePrevious(exercise.previous);
  const progression = exercise.previous
    ? suggestProgression({
        targetSets: exercise.targetSets,
        repMin: exercise.repMin,
        repMax: exercise.repMax,
        rirMin: exercise.rirMin,
        stepKg: weightStepFor(exercise.equipment),
        previous: exercise.previous.sets,
      })
    : null;

  const selectedSet = exercise.sets.find((s) => s.id === selectedSetId) ?? null;
  const targetSet = selectedSet ?? findActiveSet(exercise);
  const isExtraUncompleted = targetSet !== null && !targetSet.completed && targetSet.setNumber > exercise.targetSets;

  return (
    <Card
      ref={registerRef}
      className={cn("relative scroll-mt-28 overflow-hidden transition-colors", complete && !expanded && "bg-muted/60 shadow-none")}
    >
      <AnimatePresence>
        {celebrating ? (
          <motion.span
            key="wash"
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10 bg-success/25"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: ease.out }}
          />
        ) : null}
      </AnimatePresence>
      {complete ? <InkStamp sets={doneCount} animate={celebrating} className="absolute right-12 top-2 z-20" /> : null}
      <div className="flex items-center">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 items-center gap-3 p-4 text-left"
        >
          <ExerciseThumb
            src={exercise.imageUrls[0]}
            name={exerciseName}
            muscle={exercise.primaryMuscle}
            className={cn("size-14", complete && !expanded && "opacity-60")}
          />
          <div className="min-w-0 flex-1">
            <p className={cn("truncate text-lg font-semibold", complete && !expanded && "text-muted-foreground")}>{exerciseName}</p>
            <p className="tnum mt-0.5 truncate text-sm text-muted-foreground">
              {formatTarget(exercise.targetSets, exercise.repMin, exercise.repMax)}
              {previous ? t("card.last", { summary: `${previous.weightLabel ? `${previous.weightLabel} ` : ""}${previous.repsLabel}` }) : ""}
            </p>
            <Sparkline values={exercise.trend} className="mt-1 h-5 w-14" />
            {progression?.kind === "increase" && !complete ? (
              <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">
                <ArrowUp className="size-3" strokeWidth={3} /> {t("card.readyFor", { kg: progression.toKg })}
              </p>
            ) : null}
          </div>
          {complete ? (
            <motion.span
              className="flex shrink-0 items-center gap-1 text-sm font-semibold text-success"
              initial={celebrating ? { scale: 0.7, opacity: 0 } : false}
              animate={{ scale: 1, opacity: 1 }}
              transition={spring.pop}
            >
              <AnimatedCheck className="size-4" animate={celebrating} /> {t("card.completed")}
            </motion.span>
          ) : (
            <span className="tnum shrink-0 text-sm font-semibold text-muted-foreground">
              {doneCount} / {workingSets.length}
            </span>
          )}
          <motion.span className="shrink-0 text-muted-foreground" animate={{ rotate: expanded ? 180 : 0 }} transition={spring.snappy}>
            <ChevronDown className="size-5" />
          </motion.span>
        </button>
        <button
          type="button"
          onClick={() => onShowDetail(exercise)}
          aria-label={t("card.details", { name: exerciseName })}
          className="mr-3 flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted active:scale-95"
        >
          <Info className="size-5" />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="body"
            variants={collapse}
            initial="closed"
            animate="open"
            exit="closed"
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-5 px-4 pb-5">
              {previous ? (
                <div className="rounded-2xl bg-muted/70 px-4 py-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    {exercise.previous ? t("card.previousWorkoutDate", { date: formatShortDate(exercise.previous.localDate, intl) }) : t("card.previousWorkout")}
                  </p>
                  <p className="tnum mt-0.5 font-semibold">
                    {previous.weightLabel ? `${previous.weightLabel}  ` : ""}
                    <span className="font-medium text-muted-foreground">{previous.repsLabel}</span>
                  </p>
                  {progression ? <p className="mt-1.5 text-sm text-muted-foreground">{t(progression.reason.key, progression.reason.params)}</p> : null}
                </div>
              ) : null}

              <ul className="flex flex-wrap gap-2" aria-label={t("card.sets")}>
                {exercise.sets.map((set) => {
                  const isTarget = targetSet?.id === set.id;
                  return (
                    <li key={set.id}>
                      <motion.button
                        type="button"
                        onClick={() => setSelectedSetId(set.id)}
                        whileTap={{ scale: 0.93 }}
                        transition={spring.snappy}
                        aria-label={set.completed ? t("card.setAriaDone", { n: set.setNumber, weight: formatWeight(set.weightKg), reps: set.reps ?? 0 }) : t("card.setAria", { n: set.setNumber })}
                        aria-current={isTarget ? "true" : undefined}
                        className={cn(
                          "relative flex h-11 min-w-12 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition-colors",
                          set.completed ? "border-transparent bg-success-soft text-success" : "border-border bg-card text-muted-foreground",
                          isTarget && "text-foreground",
                        )}
                      >
                        {/* The ring that marks the active set glides from chip to chip. */}
                        {isTarget ? (
                          <motion.span layoutId={`active-set-${exercise.id}`} aria-hidden className="absolute inset-0 rounded-xl border-2 border-primary" transition={spring.layout} />
                        ) : null}
                        {/* A personal record sends one soft gold pulse out of the chip. */}
                        {recordSetId === set.id ? (
                          <motion.span
                            aria-hidden
                            className="absolute inset-0 rounded-xl bg-plate-yellow"
                            initial={{ opacity: 0.7, scale: 1 }}
                            animate={{ opacity: 0, scale: 1.6 }}
                            transition={{ duration: 0.9, repeat: 1, ease: ease.out }}
                          />
                        ) : null}
                        <AnimatePresence initial={false} mode="wait">
                          <motion.span
                            key={set.completed ? "done" : "todo"}
                            initial={{ scale: 0.7, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ opacity: 0, transition: { duration: duration.instant } }}
                            transition={spring.pop}
                            className="tnum relative flex items-center gap-1"
                          >
                            {set.completed ? (
                              <>
                                <AnimatedCheck className="size-4" animate={completedSetId === set.id} />
                                {set.weightKg === null ? "" : `${formatWeight(set.weightKg)}×`}
                                {set.reps}
                              </>
                            ) : (
                              set.setNumber
                            )}
                          </motion.span>
                        </AnimatePresence>
                      </motion.button>
                    </li>
                  );
                })}
              </ul>

              <AnimatePresence mode="wait" initial={false}>
                {targetSet ? (
                  <motion.div key={`${targetSet.id}:${targetSet.completed}`} variants={slideSwap} initial="enter" animate="center" exit="leave">
                    <SetEditor
                      exercise={exercise}
                      set={targetSet}
                      suggestion={progression?.kind === "increase" ? { fromKg: progression.fromKg, toKg: progression.toKg } : null}
                      onSave={(draft) => {
                        const now = Date.now();
                        if (lastSave.current.id === targetSet.id && now - lastSave.current.at < 400) return;
                        lastSave.current = { id: targetSet.id, at: now };
                        onSaveSet(exercise, targetSet, draft, true);
                        setSelectedSetId(null);
                      }}
                      onUndo={() => {
                        onSaveSet(exercise, targetSet, { weightKg: targetSet.weightKg, reps: targetSet.reps, rir: targetSet.rir }, false);
                        setSelectedSetId(null);
                      }}
                      onCancel={() => setSelectedSetId(null)}
                    />
                  </motion.div>
                ) : (
                  <motion.p
                    key="all-done"
                    variants={popIn}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    className="rounded-2xl bg-success-soft px-4 py-3 text-center font-semibold text-success"
                  >
                    {t("card.allSetsDone")}
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => onAddSet(exercise)}>
                  {t("card.addSet")}
                </Button>
                {isExtraUncompleted && targetSet ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onRemoveSet(targetSet);
                      setSelectedSetId(null);
                    }}
                  >
                    {t("card.removeSet", { n: targetSet.setNumber })}
                  </Button>
                ) : null}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Card>
  );
}
