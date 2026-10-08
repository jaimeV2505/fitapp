"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NumberField } from "@/components/ui/number-field";
import { Sheet } from "@/components/ui/sheet";
import { saveTargetsAction } from "../actions";
import type { NutritionTargets } from "../types";

interface TargetsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targets: NutritionTargets;
}

/** Daily targets are entered by you. The app does not suggest numbers. */
export function TargetsSheet({ open, onOpenChange, targets }: TargetsSheetProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<NutritionTargets>(targets);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveTargetsAction({
        calories: draft.calories === null ? null : Math.round(draft.calories),
        protein: draft.protein === null ? null : Math.round(draft.protein),
        carbs: draft.carbs === null ? null : Math.round(draft.carbs),
        fat: draft.fat === null ? null : Math.round(draft.fat),
      });
      if (!result.ok) return setError(result.error);
      toast.success("Targets saved");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Daily targets"
      footer={
        <Button size="lg" className="w-full" onClick={save} disabled={pending}>
          {pending ? "Saving…" : "Save targets"}
        </Button>
      }
    >
      <p className="mb-4 text-sm text-muted-foreground">
        Set the numbers you want to aim for. Leave a field empty to track it without a target.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <NumberField label="Calories" suffix="kcal" decimal={false} value={draft.calories} onChange={(calories) => setDraft((d) => ({ ...d, calories }))} />
        <NumberField label="Protein" suffix="g" decimal={false} value={draft.protein} onChange={(protein) => setDraft((d) => ({ ...d, protein }))} />
        <NumberField label="Carbs" suffix="g" decimal={false} value={draft.carbs} onChange={(carbs) => setDraft((d) => ({ ...d, carbs }))} />
        <NumberField label="Fat" suffix="g" decimal={false} value={draft.fat} onChange={(fat) => setDraft((d) => ({ ...d, fat }))} />
      </div>
      {error ? (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </Sheet>
  );
}
