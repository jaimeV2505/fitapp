"use client";

import { Reorder, useDragControls } from "motion/react";
import { ArrowDown, ArrowUp, GripVertical, Plus, Repeat, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NumberField } from "@/components/ui/number-field";
import { useIntlLocale, useLocalizedName, useT } from "@/lib/i18n/client";
import { muscleLabel } from "@/lib/i18n/labels";
import { ExercisePicker } from "@/modules/exercises/components/exercise-picker";
import { ExerciseThumb } from "@/modules/exercises/components/exercise-thumb";
import type { ExerciseListItem } from "@/modules/exercises/types";
import { savePlanDayAction } from "../actions";
import type { DayPreviewItem, PlanDayDetail } from "../types";
import { DayPlates, weekdayLabel } from "./day-plates";

interface EditableItem {
  key: string;
  exerciseId: string;
  name: string;
  imageUrl: string | null;
  primaryMuscle: DayPreviewItem["primaryMuscle"];
  equipment: DayPreviewItem["equipment"];
  sets: number;
  repMin: number;
  repMax: number;
  /** Null for exercises added in this editor: the server derives guidance from the exercise type. */
  rirMin: number | null;
  rirMax: number | null;
  allowFailureOnLastSet: boolean | null;
}

const toEditable = (item: DayPreviewItem): EditableItem => ({
  key: crypto.randomUUID(),
  exerciseId: item.exerciseId,
  name: item.name,
  imageUrl: item.imageUrl,
  primaryMuscle: item.primaryMuscle,
  equipment: item.equipment,
  sets: item.sets,
  repMin: item.repMin,
  repMax: item.repMax,
  rirMin: item.rirMin,
  rirMax: item.rirMax,
  allowFailureOnLastSet: item.allowFailureOnLastSet,
});

const signature = (items: readonly { exerciseId: string; sets: number; repMin: number; repMax: number }[]): string =>
  items.map((i) => `${i.exerciseId}:${i.sets}:${i.repMin}:${i.repMax}`).join("|");

function move<T>(list: readonly T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  if (item === undefined) return next;
  next.splice(to, 0, item);
  return next;
}

interface RowProps {
  item: EditableItem;
  index: number;
  count: number;
  onChange: (patch: Partial<EditableItem>) => void;
  onRemove: () => void;
  onSwap: () => void;
  onMove: (to: number) => void;
}

function EditorRow({ item, index, count, onChange, onRemove, onSwap, onMove }: RowProps) {
  const controls = useDragControls();
  const t = useT();
  const localName = useLocalizedName();
  const name = localName(item.name);
  return (
    <Reorder.Item value={item} dragListener={false} dragControls={controls} className="rounded-2xl border border-border bg-card p-3" whileDrag={{ scale: 1.02, zIndex: 10 }}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={t("planEditor.drag", { name })}
          onPointerDown={(event) => controls.start(event)}
          className="flex size-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-muted-foreground active:cursor-grabbing"
        >
          <GripVertical className="size-5" />
        </button>
        <ExerciseThumb src={item.imageUrl ?? undefined} name={name} muscle={item.primaryMuscle} className="size-12" sizes="48px" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{name}</p>
          <p className="truncate text-sm text-muted-foreground">{muscleLabel(t, item.primaryMuscle)}</p>
        </div>
        <div className="flex shrink-0 items-center">
          <button type="button" onClick={() => onMove(index - 1)} disabled={index === 0} aria-label={t("planEditor.moveUp", { name })} className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted disabled:opacity-30">
            <ArrowUp className="size-4" />
          </button>
          <button type="button" onClick={() => onMove(index + 1)} disabled={index === count - 1} aria-label={t("planEditor.moveDown", { name })} className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted disabled:opacity-30">
            <ArrowDown className="size-4" />
          </button>
          <button type="button" onClick={onSwap} aria-label={t("planEditor.replace", { name })} className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted">
            <Repeat className="size-4" />
          </button>
          <button type="button" onClick={onRemove} aria-label={t("planEditor.remove", { name })} className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted">
            <X className="size-4" />
          </button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <NumberField label={t("planEditor.sets")} decimal={false} value={item.sets} onChange={(v) => onChange({ sets: Math.min(10, Math.max(1, v ?? 1)) })} />
        <NumberField label={t("planEditor.repsFrom")} decimal={false} value={item.repMin} onChange={(v) => onChange({ repMin: Math.min(100, Math.max(1, v ?? 1)) })} />
        <NumberField label={t("planEditor.repsTo")} decimal={false} value={item.repMax} onChange={(v) => onChange({ repMax: Math.min(100, Math.max(1, v ?? 1)) })} />
      </div>
      {item.repMin > item.repMax ? <p role="alert" className="mt-2 text-sm text-destructive">{t("planEditor.minMax")}</p> : null}
    </Reorder.Item>
  );
}

export function PlanEditor({ days, todayDayId }: { days: PlanDayDetail[]; todayDayId: string | null }) {
  const router = useRouter();
  const t = useT();
  const localName = useLocalizedName();
  const intl = useIntlLocale();
  const [selectedId, setSelectedId] = useState(days[0]?.id ?? "");
  const [drafts, setDrafts] = useState<Record<string, EditableItem[]>>(() =>
    Object.fromEntries(days.map((day) => [day.id, day.items.map(toEditable)])),
  );
  const [picker, setPicker] = useState<{ mode: "add" } | { mode: "replace"; key: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const baseline = useMemo(() => new Map(days.map((day) => [day.id, signature(day.items)])), [days]);
  const dirtyIds = useMemo(
    () => new Set(Object.entries(drafts).filter(([id, items]) => baseline.get(id) !== signature(items)).map(([id]) => id)),
    [drafts, baseline],
  );

  const selected = days.find((day) => day.id === selectedId) ?? days[0];
  if (!selected) return null;
  const items = drafts[selected.id] ?? [];
  const invalid = Object.values(drafts).some((list) => list.some((i) => i.repMin > i.repMax) || list.length === 0);

  const setItems = (next: EditableItem[]) => setDrafts((d) => ({ ...d, [selected.id]: next }));

  function pick(exercise: ExerciseListItem) {
    const target = picker;
    setPicker(null);
    if (!target) return;
    if (target.mode === "add") {
      setItems([
        ...items,
        {
          key: crypto.randomUUID(),
          exerciseId: exercise.id,
          name: exercise.name,
          imageUrl: exercise.imageUrl,
          primaryMuscle: exercise.primaryMuscle,
          equipment: exercise.equipment,
          sets: 3,
          repMin: 8,
          repMax: 12,
          rirMin: null,
          rirMax: null,
          allowFailureOnLastSet: null,
        },
      ]);
    } else {
      setItems(
        items.map((item) =>
          item.key === target.key
            ? { ...item, exerciseId: exercise.id, name: exercise.name, imageUrl: exercise.imageUrl, primaryMuscle: exercise.primaryMuscle, equipment: exercise.equipment, rirMin: null, rirMax: null, allowFailureOnLastSet: null }
            : item,
        ),
      );
    }
  }

  function saveAll() {
    startTransition(async () => {
      let saved = 0;
      for (const dayId of dirtyIds) {
        const result = await savePlanDayAction({
          dayId,
          items: (drafts[dayId] ?? []).map((i) => ({
            exerciseId: i.exerciseId,
            sets: i.sets,
            repMin: i.repMin,
            repMax: i.repMax,
            rirMin: i.rirMin,
            rirMax: i.rirMax,
            allowFailureOnLastSet: i.allowFailureOnLastSet,
          })),
        });
        if (!result.ok) {
          toast.error(result.error);
          router.refresh();
          return;
        }
        saved += 1;
      }
      toast.success(saved === 1 ? t("planEditor.saved") : t("planEditor.savedDays", { count: saved }), { description: t("planEditor.keepsHistory") });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <DayPlates days={days} selectedId={selected.id} todayId={todayDayId} onSelect={setSelectedId} markedIds={dirtyIds} />

      <header>
        <p className="text-sm font-medium text-muted-foreground">{weekdayLabel(selected, true, intl)}</p>
        <h2 className="display-lg mt-1">{localName(selected.focus)}</h2>
      </header>

      <Reorder.Group axis="y" values={items} onReorder={setItems} className="flex flex-col gap-2">
        {items.map((item, index) => (
          <EditorRow
            key={item.key}
            item={item}
            index={index}
            count={items.length}
            onChange={(patch) => setItems(items.map((i) => (i.key === item.key ? { ...i, ...patch } : i)))}
            onRemove={() => setItems(items.filter((i) => i.key !== item.key))}
            onSwap={() => setPicker({ mode: "replace", key: item.key })}
            onMove={(to) => setItems(move(items, index, to))}
          />
        ))}
      </Reorder.Group>
      {items.length === 0 ? <p className="rounded-xl bg-muted/60 px-4 py-6 text-center text-sm text-muted-foreground">{t("planEditor.needOne")}</p> : null}

      <Button variant="secondary" onClick={() => setPicker({ mode: "add" })}>
        <Plus className="size-5" /> {t("planEditor.addExercise")}
      </Button>

      <div className="pb-safe sticky bottom-24 z-20 md:bottom-4">
        <Button size="lg" className="w-full shadow-card" disabled={dirtyIds.size === 0 || invalid || pending} onClick={saveAll}>
          {pending ? t("planEditor.saving") : dirtyIds.size === 0 ? t("planEditor.noChanges") : dirtyIds.size === 1 ? t("planEditor.saveChanges") : t("planEditor.saveDays", { count: dirtyIds.size })}
        </Button>
      </div>

      {picker ? <ExercisePicker title={picker.mode === "add" ? t("planEditor.addExercise") : t("planEditor.replaceExercise")} onPick={pick} onClose={() => setPicker(null)} /> : null}
    </div>
  );
}
