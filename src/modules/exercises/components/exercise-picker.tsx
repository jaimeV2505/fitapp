"use client";

import { Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { EQUIPMENT, MOVEMENT_TYPES, MUSCLE_GROUPS, type Equipment, type MovementType, type MuscleGroup } from "@/lib/db/schema/enums";
import { useLocalizedName, useT } from "@/lib/i18n/client";
import { equipmentLabel, muscleLabel } from "@/lib/i18n/labels";
import { cn } from "@/lib/utils";
import { createExerciseAction, searchExercisesAction } from "../actions";
import type { ExerciseListItem } from "../types";
import { ExerciseThumb } from "./exercise-thumb";

interface ExercisePickerProps {
  title: string;
  onPick: (exercise: ExerciseListItem) => void;
  onClose: () => void;
}

/** Search the exercise library and pick one. Mount it only while it is open. */
export function ExercisePicker({ title, onPick, onClose }: ExercisePickerProps) {
  const t = useT();
  const localName = useLocalizedName();
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<MuscleGroup | null>(null);
  const [loaded, setLoaded] = useState<{ key: string; items: ExerciseListItem[]; error: string | null } | null>(null);
  const key = `${query.trim()}|${muscle ?? ""}`;
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<{ name: string; muscle: MuscleGroup; equipment: Equipment | null; type: MovementType }>({
    name: "",
    muscle: "chest",
    equipment: null,
    type: "compound",
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Debounce typing; state is only set from the async callback, after the response arrives.
    const timer = window.setTimeout(async () => {
      const result = await searchExercisesAction({ query: query.trim() || undefined, muscle: muscle ?? undefined });
      if (cancelled) return;
      setLoaded({ key, items: result.ok ? result.data : [], error: result.ok ? null : result.error });
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [key, query, muscle]);

  const loading = loaded?.key !== key;

  async function create() {
    setSaving(true);
    setCreateError(null);
    const result = await createExerciseAction({
      name: draft.name,
      primaryMuscle: draft.muscle,
      equipment: draft.equipment,
      movementType: draft.type,
    });
    setSaving(false);
    if (!result.ok) return setCreateError(result.error);
    onPick(result.data);
  }

  const chip = (active: boolean) =>
    cn("h-9 shrink-0 rounded-full px-3 text-sm font-semibold transition-colors", active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground");

  return (
    <Sheet open onOpenChange={(open) => (open ? undefined : onClose())} title={creating ? t("picker.newExercise") : title}>
      {creating ? (
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="custom-name" className="mb-1.5 block text-sm font-medium text-muted-foreground">
              {t("picker.name")}
            </label>
            <input
              id="custom-name"
              autoFocus
              value={draft.name}
              onChange={(event) => setDraft((d) => ({ ...d, name: event.target.value }))}
              maxLength={80}
              placeholder={t("picker.namePlaceholder")}
              className="h-12 w-full rounded-xl bg-input px-3 text-base outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-muted-foreground">{t("picker.mainMuscle")}</p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("picker.mainMuscle")}>
              {MUSCLE_GROUPS.map((group) => (
                <button key={group} type="button" role="radio" aria-checked={draft.muscle === group} onClick={() => setDraft((d) => ({ ...d, muscle: group }))} className={chip(draft.muscle === group)}>
                  {muscleLabel(t, group)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-muted-foreground">{t("picker.equipment")}</p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("picker.equipment")}>
              {[null, ...EQUIPMENT].map((item) => (
                <button key={item ?? "none"} type="button" role="radio" aria-checked={draft.equipment === item} onClick={() => setDraft((d) => ({ ...d, equipment: item }))} className={chip(draft.equipment === item)}>
                  {item ? equipmentLabel(t, item) : t("picker.notSet")}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-muted-foreground">{t("picker.type")}</p>
            <div className="flex gap-2" role="radiogroup" aria-label={t("picker.type")}>
              {MOVEMENT_TYPES.map((type) => (
                <button key={type} type="button" role="radio" aria-checked={draft.type === type} onClick={() => setDraft((d) => ({ ...d, type }))} className={chip(draft.type === type)}>
                  {t(`picker.${type}`)}
                </button>
              ))}
            </div>
          </div>
          {createError ? (
            <p role="alert" className="text-sm text-destructive">
              {createError}
            </p>
          ) : null}
          <Button size="lg" onClick={create} disabled={saving || draft.name.trim().length < 2}>
            {saving ? t("picker.creating") : t("picker.createUse")}
          </Button>
          <Button variant="ghost" onClick={() => setCreating(false)}>
            {t("picker.backToSearch")}
          </Button>
        </div>
      ) : (
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("picker.search")}
            aria-label={t("picker.search")}
            className="h-12 w-full rounded-xl bg-input pl-10 pr-3 text-base outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1" role="radiogroup" aria-label={t("picker.muscle")}>
          {[null, ...MUSCLE_GROUPS].map((group) => (
            <button
              key={group ?? "all"}
              type="button"
              role="radio"
              aria-checked={muscle === group}
              onClick={() => setMuscle(group)}
              className={cn(
                "h-9 shrink-0 rounded-full px-3 text-sm font-semibold transition-colors",
                muscle === group ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {group ? muscleLabel(t, group) : t("picker.all")}
            </button>
          ))}
        </div>

        {loaded?.error ? (
          <p role="alert" className="text-sm text-destructive">
            {loaded.error}
          </p>
        ) : null}

        <ul className={cn("flex flex-col gap-1 transition-opacity", loading && "opacity-50")}>
          {(loaded?.items ?? []).map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onPick(item)}
                className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-muted"
              >
                <ExerciseThumb src={item.imageUrl ?? undefined} name={localName(item.name)} muscle={item.primaryMuscle} className="size-12" sizes="48px" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{localName(item.name)}</span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {muscleLabel(t, item.primaryMuscle)}
                    {item.equipment ? ` · ${equipmentLabel(t, item.equipment)}` : ""}
                  </span>
                </span>
              </button>
            </li>
          ))}
          {!loading && loaded && loaded.items.length === 0 ? <li className="py-8 text-center text-sm text-muted-foreground">{t("picker.none")}</li> : null}
        </ul>

        <Button variant="secondary" onClick={() => setCreating(true)}>
          <Plus className="size-5" /> {t("picker.create")}
        </Button>
      </div>
      )}
    </Sheet>
  );
}
