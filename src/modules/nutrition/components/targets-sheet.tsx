"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NumberField } from "@/components/ui/number-field";
import { Sheet } from "@/components/ui/sheet";
import { useT } from "@/lib/i18n/client";
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
  const t = useT();
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
      toast.success(t("targets.saved"));
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("targets.title")}
      footer={
        <Button size="lg" className="w-full" onClick={save} disabled={pending}>
          {pending ? t("targets.saving") : t("targets.save")}
        </Button>
      }
    >
      <p className="mb-4 text-sm text-muted-foreground">
        {t("targets.intro")}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <NumberField label={t("nutrition.calories")} suffix="kcal" decimal={false} value={draft.calories} onChange={(calories) => setDraft((d) => ({ ...d, calories }))} />
        <NumberField label={t("nutrition.protein")} suffix="g" decimal={false} value={draft.protein} onChange={(protein) => setDraft((d) => ({ ...d, protein }))} />
        <NumberField label={t("nutrition.carbs")} suffix="g" decimal={false} value={draft.carbs} onChange={(carbs) => setDraft((d) => ({ ...d, carbs }))} />
        <NumberField label={t("nutrition.fat")} suffix="g" decimal={false} value={draft.fat} onChange={(fat) => setDraft((d) => ({ ...d, fat }))} />
      </div>
      {error ? (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </Sheet>
  );
}
