"use client";

import { Info } from "lucide-react";
import { MUSCLE_LABEL } from "@/lib/muscles";
import type { ExerciseListItem } from "../types";
import { ExerciseSheet } from "./exercise-sheet";
import { ExerciseThumb } from "./exercise-thumb";
import { useExerciseSheet } from "./use-exercise-sheet";

export function LibraryList({ items }: { items: ExerciseListItem[] }) {
  const sheet = useExerciseSheet();

  if (items.length === 0) {
    return <p className="rounded-2xl border border-border bg-card p-6 text-muted-foreground">No exercises match your search.</p>;
  }

  return (
    <>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => sheet.show({ exerciseId: item.id, name: item.name })}
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-transform active:scale-[0.99]"
            >
              <ExerciseThumb src={item.imageUrl ?? undefined} name={item.name} muscle={item.primaryMuscle} className="size-14" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{item.name}</span>
                <span className="block truncate text-sm text-muted-foreground">
                  {MUSCLE_LABEL[item.primaryMuscle]}
                  {item.equipment ? ` · ${item.equipment}` : ""}
                </span>
              </span>
              <Info className="size-5 shrink-0 text-muted-foreground" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <ExerciseSheet state={sheet.state} onOpenChange={sheet.setOpen} />
    </>
  );
}
