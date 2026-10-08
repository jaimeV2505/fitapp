"use client";

import { Drawer } from "vaul";
import { Skeleton } from "@/components/ui/skeleton";
import { formatShortDate } from "@/lib/time";
import type { ExerciseDetail } from "../types";
import type { ExerciseSheetState } from "./use-exercise-sheet";
import { ExerciseGallery } from "./exercise-gallery";
import { HistoryChart } from "./history-chart";
import { MuscleMap } from "./muscle-map";

function kg(value: number | null): string {
  return value === null ? "–" : `${Math.round(value * 10) / 10} kg`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/70 p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="font-display tnum mt-0.5 text-3xl font-bold">{value}</p>
    </div>
  );
}

function Body({ detail }: { detail: ExerciseDetail }) {
  const last = detail.history[detail.history.length - 1];
  return (
    <div className="flex flex-col gap-6">
      <ExerciseGallery images={detail.imageUrls} name={detail.name} />

      <MuscleMap primary={detail.primaryMuscle} secondary={detail.secondaryMuscles} />

      <section aria-labelledby="records-heading" className="flex flex-col gap-3">
        <h3 id="records-heading" className="text-lg font-semibold">
          Your numbers
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Heaviest" value={kg(detail.records.maxWeightKg)} />
          <Stat label="Est. 1RM" value={kg(detail.records.bestEstimated1RmKg)} />
          <Stat label="Best volume" value={kg(detail.records.bestSessionVolumeKg)} />
        </div>
        {last ? (
          <p className="text-sm text-muted-foreground">
            Last time ({formatShortDate(last.localDate)}): {kg(last.topWeightKg)}
            {last.repsAtTopWeight !== null ? ` × ${last.repsAtTopWeight}` : ""} · {last.sets} sets
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">No finished workouts with this exercise yet.</p>
        )}
        <HistoryChart points={detail.history} />
      </section>

      {detail.instructions.length > 0 ? (
        <section aria-labelledby="how-heading" className="flex flex-col gap-3">
          <h3 id="how-heading" className="text-lg font-semibold">
            How to do it
          </h3>
          <ol className="flex list-decimal flex-col gap-2 pl-5 text-[0.95rem] leading-relaxed marker:font-semibold marker:text-muted-foreground">
            {detail.instructions.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}

interface ExerciseSheetProps {
  state: ExerciseSheetState;
  onOpenChange: (open: boolean) => void;
}

export function ExerciseSheet({ state, onOpenChange }: ExerciseSheetProps) {
  return (
    <Drawer.Root open={state.open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/55" />
        <Drawer.Content
          className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-xl flex-col rounded-t-[2rem] bg-background outline-none"
          aria-describedby={undefined}
        >
          <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-border" aria-hidden />
          <Drawer.Title className="display-lg px-5 pb-3 pt-4">{state.title}</Drawer.Title>
          <div className="pb-safe overflow-y-auto px-5 pb-8" data-vaul-no-drag>
            {state.loading ? (
              <div className="flex flex-col gap-4">
                <Skeleton className="aspect-[4/3] w-full rounded-3xl" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : state.error ? (
              <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                {state.error}
              </p>
            ) : state.detail ? (
              <Body detail={state.detail} />
            ) : null}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
