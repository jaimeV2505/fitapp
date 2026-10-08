"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, CloudOff, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { fireCelebration } from "@/lib/celebrate";
import { duration, ease, fadeUp, listItem, spring, staggerContainer, useHaptics } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { ProgressRing } from "@/components/ui/progress-ring";
import { ExerciseSheet } from "@/modules/exercises/components/exercise-sheet";
import { useExerciseSheet } from "@/modules/exercises/components/use-exercise-sheet";
import { abandonWorkoutAction, addSetAction, finishWorkoutAction, removeSetAction } from "../actions";
import { applyAddSet, applyRemoveSet, applySaveSet, applySaveSets } from "../domain/logger-state";
import { computeSessionProgress } from "../domain/metrics";
import { findActiveExerciseId, findActiveSet, type SetDraft } from "../domain/prefill";
import { evaluateSet } from "../domain/records";
import type { ExerciseSessionView, SaveSetInput, SessionView, SetView } from "../types";
import { ExerciseCard } from "./exercise-card";
import { showRecordToast } from "./record-toast";
import { RestTimer, type RestState } from "./rest-timer";
import { useSetSync } from "./use-set-sync";

const LIST_VARIANTS = staggerContainer(0.04, 0.02);

/** State confirmed by the server. Unconfirmed sets live in the sync queue and are overlaid on top. */
type BaseAction =
  | { type: "confirmed"; input: SaveSetInput }
  | { type: "add"; exerciseSessionId: string; set: SetView }
  | { type: "remove"; setId: string };

function baseReducer(state: SessionView, action: BaseAction): SessionView {
  switch (action.type) {
    case "confirmed":
      return applySaveSet(state, action.input);
    case "add":
      return applyAddSet(state, action.exerciseSessionId, action.set);
    case "remove":
      return applyRemoveSet(state, action.setId);
  }
}

interface WorkoutLoggerProps {
  initialSession: SessionView;
  restTimerEnabled: boolean;
}

export function WorkoutLogger({ initialSession, restTimerEnabled }: WorkoutLoggerProps) {
  const router = useRouter();
  const [base, dispatch] = useReducer(baseReducer, initialSession);
  const { engine, snapshot } = useSetSync(
    initialSession.id,
    useCallback((input: SaveSetInput) => dispatch({ type: "confirmed", input }), []),
  );

  // Optimistic view: confirmed state + sets still waiting to sync.
  const session = useMemo(() => applySaveSets(base, snapshot.pending), [base, snapshot.pending]);
  const progress = useMemo(() => computeSessionProgress(session.exercises), [session.exercises]);

  const sheet = useExerciseSheet();
  const [expandedId, setExpandedId] = useState<string | null>(() => findActiveExerciseId(initialSession.exercises));
  const [rest, setRest] = useState<RestState | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<"finish" | "discard" | null>(null);
  const [confirming, setConfirming] = useState<"finish" | "discard" | null>(null);

  // Short-lived highlights: the exercise that was just completed, and the set that just broke a record.
  const [flashId, setFlashId] = useState<string | null>(null);
  const [recordSetId, setRecordSetId] = useState<string | null>(null);
  const [completedSetId, setCompletedSetId] = useState<string | null>(null);
  const timers = useRef<number[]>([]);
  const haptic = useHaptics();
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((id) => window.clearTimeout(id));
  }, []);
  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  const cardRefs = useRef(new Map<string, HTMLElement>());
  const finishRef = useRef<HTMLDivElement | null>(null);

  const scrollToCard = useCallback((id: string | null) => {
    // Wait for the previous card to finish collapsing so the target position is final.
    window.setTimeout(() => {
      const target = id ? cardRefs.current.get(id) : finishRef.current;
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 230);
  }, []);

  const handleSaveSet = useCallback(
    (exercise: ExerciseSessionView, set: SetView, draft: SetDraft, completed: boolean) => {
      const input: SaveSetInput = {
        setId: set.id,
        weightKg: draft.weightKg,
        reps: draft.reps,
        rir: draft.rir,
        completed,
        completedAt: completed ? new Date().toISOString() : null,
      };
      setMessage(null);
      engine.enqueue(input.setId, input);

      if (!completed) return;
      haptic(12);
      setCompletedSetId(set.id);
      later(() => setCompletedSetId(null), 900);

      const updated = applySaveSet(session, input);
      const nextActive = findActiveExerciseId(updated.exercises);
      const updatedExercise = updated.exercises.find((e) => e.id === exercise.id);
      const exerciseDone = updatedExercise ? findActiveSet(updatedExercise) === null : false;
      // Editing an already completed set must not restart the rest timer or jump to another exercise.
      const isNewCompletion = !set.completed;

      if (isNewCompletion && restTimerEnabled && nextActive !== null) {
        const startedAt = Date.now();
        setRest({ id: startedAt, endsAt: startedAt + exercise.restSeconds * 1000, totalSeconds: exercise.restSeconds, label: exercise.name });
      }

      // Personal record: compared with earlier sessions and with the sets already done today.
      const earlier = exercise.sets.filter((s) => s.completed && !s.isWarmup && s.id !== set.id);
      const record =
        isNewCompletion && !set.isWarmup ? evaluateSet(exercise.bests, earlier, { weightKg: draft.weightKg, reps: draft.reps }) : null;
      if (record) {
        void fireCelebration("pr");
        haptic([30, 40, 30]);
        showRecordToast(exercise.name, record);
        setRecordSetId(set.id);
        later(() => setRecordSetId(null), 2200);
      }

      if (isNewCompletion && exerciseDone) {
        // This exercise is done: move on to the next one that still has work left.
        const upcoming = updated.exercises.find((e) => e.id === nextActive);
        setFlashId(exercise.id);
        later(() => setFlashId(null), 1000);
        if (!record) {
          toast.success(`${exercise.name} done`, {
            description: upcoming ? `Next: ${upcoming.name}` : "All exercises done. Finish when you're ready.",
            duration: 2600,
          });
        }
        setExpandedId(nextActive);
        scrollToCard(nextActive);
      }
    },
    [engine, haptic, later, restTimerEnabled, scrollToCard, session],
  );

  const handleAddSet = useCallback(async (exercise: ExerciseSessionView) => {
    const result = await addSetAction({ exerciseSessionId: exercise.id });
    if (!result.ok) {
      setMessage(result.code === "internal" ? "Could not add a set. Check your connection." : result.error);
      return;
    }
    dispatch({ type: "add", exerciseSessionId: exercise.id, set: result.data });
  }, []);

  const handleRemoveSet = useCallback(async (set: SetView) => {
    const result = await removeSetAction({ setId: set.id });
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    dispatch({ type: "remove", setId: set.id });
  }, []);

  const dismissRest = useCallback(() => setRest(null), []);
  const openSets = progress.setsTotal - progress.setsCompleted;

  async function finish() {
    setBusy("finish");
    setMessage(null);
    await engine.flush();
    if (engine.getSnapshot().pending.length > 0) {
      setMessage("Some sets are still waiting to sync. Reconnect and try again; nothing is lost.");
      setBusy(null);
      return;
    }
    const result = await finishWorkoutAction({ sessionId: session.id });
    if (!result.ok) {
      setMessage(result.error);
      setBusy(null);
      return;
    }
    router.replace(`/workout/${session.id}?done=1`);
    router.refresh();
  }

  async function discard() {
    setBusy("discard");
    const result = await abandonWorkoutAction({ sessionId: session.id });
    if (!result.ok) {
      setMessage(result.error);
      setBusy(null);
      return;
    }
    router.replace("/workout");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="sticky top-0 z-20 -mx-4 bg-background/85 px-4 pb-3 pt-2 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-muted-foreground">Today</p>
            <h1 className="display-xl truncate">{session.focus}</h1>
            <p className="tnum text-sm text-muted-foreground">
              {progress.exercisesCompleted} / {progress.exercisesTotal} exercises
            </p>
          </div>
          <ProgressRing percent={progress.percent} size={68} strokeWidth={7} tone={progress.percent === 100 ? "success" : "primary"}>
            <AnimatedNumber value={progress.percent} suffix="%" className="text-sm font-bold" />
          </ProgressRing>
        </div>
        <SyncStatus status={snapshot.status} pending={snapshot.pending.length} error={snapshot.lastError} />
      </header>

      {message ? (
        <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {message}
        </p>
      ) : null}

      <motion.div className="flex flex-col gap-3" variants={LIST_VARIANTS} initial="hidden" animate="show">
        {session.exercises.map((exercise) => (
          // Cards glide when a neighbour grows or collapses; only position animates, so content never stretches.
          <motion.div key={exercise.id} variants={listItem} layout="position" transition={spring.layout}>
            <ExerciseCard
              exercise={exercise}
              expanded={expandedId === exercise.id}
              celebrating={flashId === exercise.id}
              recordSetId={recordSetId}
              completedSetId={completedSetId}
              onToggle={() => setExpandedId(expandedId === exercise.id ? null : exercise.id)}
              onSaveSet={handleSaveSet}
              onAddSet={handleAddSet}
              onRemoveSet={handleRemoveSet}
              onShowDetail={(target) => sheet.show({ exerciseId: target.exerciseId, name: target.name })}
              registerRef={(element) => {
                if (element) cardRefs.current.set(exercise.id, element);
                else cardRefs.current.delete(exercise.id);
              }}
            />
          </motion.div>
        ))}
      </motion.div>

      <div ref={finishRef} className="scroll-mt-28">
        <Card className="mt-2 overflow-hidden p-4">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={confirming ?? "idle"} variants={fadeUp} initial="hidden" animate="show" exit="exit" className="flex flex-col gap-3">
          {confirming === "finish" ? (
            <>
              <p className="text-center font-medium">
                {openSets} {openSets === 1 ? "set is" : "sets are"} still open. Unfinished sets are not counted.
              </p>
              <Button size="lg" onClick={finish} disabled={busy !== null}>
                {busy === "finish" ? "Finishing…" : "Finish workout"}
              </Button>
              <Button variant="ghost" onClick={() => setConfirming(null)} disabled={busy !== null}>
                Keep training
              </Button>
            </>
          ) : confirming === "discard" ? (
            <>
              <p className="text-center font-medium">Discard this workout? Logged sets stay in your history marked as discarded.</p>
              <Button variant="destructive" size="lg" onClick={discard} disabled={busy !== null}>
                {busy === "discard" ? "Discarding…" : "Discard workout"}
              </Button>
              <Button variant="ghost" onClick={() => setConfirming(null)} disabled={busy !== null}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                size="lg"
                variant={openSets === 0 ? "success" : "primary"}
                disabled={busy !== null}
                onClick={() => (openSets > 0 ? setConfirming("finish") : void finish())}
              >
                {busy === "finish" ? "Finishing…" : "Finish workout"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirming("discard")}>
                Discard workout
              </Button>
            </>
          )}
            </motion.div>
          </AnimatePresence>
        </Card>
      </div>

      <AnimatePresence>
        {rest ? (
          <RestTimer
            key={rest.id}
            rest={rest}
            onAddSeconds={(seconds) => setRest((r) => (r ? { ...r, endsAt: r.endsAt + seconds * 1000, totalSeconds: r.totalSeconds + seconds } : r))}
            onDismiss={dismissRest}
          />
        ) : null}
      </AnimatePresence>

      <ExerciseSheet state={sheet.state} onOpenChange={sheet.setOpen} />
    </div>
  );
}

function SyncStatus({ status, pending, error }: { status: "synced" | "saving" | "offline" | "error"; pending: number; error: string | null }) {
  const content =
    status === "offline" ? (
      <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <CloudOff className="size-4" /> Offline · {pending} {pending === 1 ? "set" : "sets"} saved on this device, syncing automatically
      </p>
    ) : status === "error" ? (
      <p className="text-sm font-medium text-destructive">{error ?? "Syncing stopped. Sign in again to continue."}</p>
    ) : status === "saving" ? (
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" /> Saving…
      </p>
    ) : (
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Check className="size-4" /> All changes saved
      </p>
    );

  return (
    <div className="mt-2 h-5 overflow-hidden" role="status" aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={status}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: duration.fast, ease: ease.out }}
        >
          {content}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
