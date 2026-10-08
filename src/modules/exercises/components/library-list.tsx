"use client";

import dynamic from "next/dynamic";
import { Info } from "lucide-react";
import { useLocalizedName, useT } from "@/lib/i18n/client";
import { equipmentLabel, muscleLabel } from "@/lib/i18n/labels";
import type { ExerciseListItem } from "../types";
import { ExerciseThumb } from "./exercise-thumb";
import { useExerciseSheet } from "./use-exercise-sheet";

// The detail sheet (vaul, photos, map) is only needed once someone opens it: keep it out of the first load.
const ExerciseSheet = dynamic(() => import("./exercise-sheet").then((m) => m.ExerciseSheet), { ssr: false });


export function LibraryList({ items }: { items: ExerciseListItem[] }) {
  const sheet = useExerciseSheet();
  const t = useT();
  const localName = useLocalizedName();

  if (items.length === 0) {
    return <p className="rounded-2xl border border-border bg-card p-6 text-muted-foreground">{t("library.noMatch")}</p>;
  }

  return (
    <>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => sheet.show({ exerciseId: item.id, name: localName(item.name) })}
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-transform active:scale-[0.99]"
            >
              <ExerciseThumb src={item.imageUrl ?? undefined} name={localName(item.name)} muscle={item.primaryMuscle} className="size-14" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{localName(item.name)}</span>
                <span className="block truncate text-sm text-muted-foreground">
                  {muscleLabel(t, item.primaryMuscle)}
                  {item.equipment ? ` · ${equipmentLabel(t, item.equipment)}` : ""}
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
