"use client";

import { motion } from "motion/react";
import { ArrowUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { spring, useHaptics } from "@/lib/motion";
import { prefillDraft, weightStepFor, type SetDraft } from "../domain/prefill";
import type { ExerciseSessionView, SetView } from "../types";
import { NumberStepper } from "./number-stepper";

const RIR_OPTIONS = [0, 1, 2, 3, 4] as const;

interface SetEditorProps {
  exercise: ExerciseSessionView;
  set: SetView;
  /** Called with the values to store. */
  onSave: (draft: SetDraft) => void;
  /** Only for sets that are already completed: marks the set as not done again. */
  onUndo?: () => void;
  onCancel?: () => void;
  /** A suggested heavier weight. Shown as an optional button; never applied automatically. */
  suggestion?: { fromKg: number; toKg: number } | null;
}

/**
 * Logs one set. Values start prefilled (see prefillDraft), so the common case is a single tap on
 * the complete button. The parent re-mounts this component (via key) when the target set changes.
 */
export function SetEditor({ exercise, set, onSave, onUndo, onCancel, suggestion = null }: SetEditorProps) {
  const [draft, setDraft] = useState<SetDraft>(() => prefillDraft(exercise, set));
  const haptic = useHaptics();
  const editing = set.completed;
  const isLastTargetSet = set.setNumber === exercise.targetSets;
  const canSave = draft.reps !== null && draft.reps > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <p className="display-md">Set {set.setNumber}</p>
        {exercise.allowFailureOnLastSet && isLastTargetSet ? (
          <p className="text-sm text-muted-foreground">Last set: technical failure is fine</p>
        ) : null}
      </div>

      <NumberStepper
        label="Weight"
        unit="kg"
        decimal
        value={draft.weightKg}
        step={weightStepFor(exercise.equipment)}
        max={1000}
        onChange={(weightKg) => setDraft((d) => ({ ...d, weightKg }))}
      />
      {suggestion && !editing && draft.weightKg !== suggestion.toKg ? (
        <button
          type="button"
          onClick={() => setDraft((d) => ({ ...d, weightKg: suggestion.toKg }))}
          className="-mt-2 flex items-center gap-2 self-start rounded-full bg-success-soft px-3 py-1.5 text-sm font-semibold text-success"
        >
          <ArrowUp className="size-4" /> Try {suggestion.toKg} kg (from {suggestion.fromKg})
        </button>
      ) : null}
      <NumberStepper
        label="Reps"
        value={draft.reps}
        step={1}
        max={200}
        onChange={(reps) => setDraft((d) => ({ ...d, reps }))}
      />

      <div>
        <p className="mb-1.5 text-sm font-medium text-muted-foreground">
          Reps in reserve{" "}
          <span className="font-normal">
            (target {exercise.rirMin === exercise.rirMax ? exercise.rirMin : `${exercise.rirMin}\u2013${exercise.rirMax}`})
          </span>
        </p>
        <div role="radiogroup" aria-label="Reps in reserve" className="grid grid-cols-5 gap-2">
          {RIR_OPTIONS.map((option) => {
            const selected = draft.rir === option;
            const inTarget = option >= exercise.rirMin && option <= exercise.rirMax;
            return (
              <motion.button
                key={option}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  haptic(6);
                  setDraft((d) => ({ ...d, rir: selected ? null : option }));
                }}
                whileTap={{ scale: 0.92 }}
                transition={spring.snappy}
                className={cn("font-display tnum relative h-12 rounded-xl text-lg font-bold", selected ? "text-background" : "bg-muted text-foreground")}
              >
                {/* One dark pill slides between RIR values instead of each button switching colour. */}
                {selected ? <motion.span layoutId={`rir-pill-${set.id}`} aria-hidden className="absolute inset-0 rounded-xl bg-foreground" transition={spring.layout} /> : null}
                <span className="relative">{option}</span>
                {inTarget && !selected ? (
                  <span aria-hidden className="absolute bottom-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-primary" />
                ) : null}
              </motion.button>
            );
          })}
        </div>
      </div>

      <Button
        size="lg"
        className="mt-1 w-full"
        disabled={!canSave}
        onClick={() => {
          haptic(12);
          onSave(draft);
        }}
      >
        {editing ? "Update set" : "Complete set"}
      </Button>

      {editing ? (
        <div className="flex gap-2">
          {onUndo ? (
            <Button variant="secondary" size="sm" className="flex-1" onClick={onUndo}>
              Mark as not done
            </Button>
          ) : null}
          {onCancel ? (
            <Button variant="ghost" size="sm" className="flex-1" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
