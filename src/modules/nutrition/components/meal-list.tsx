"use client";

import { Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { deleteMealAction } from "../actions";
import { useLocalizedName, useT } from "@/lib/i18n/client";
import { mealLabel, unitLabel } from "@/lib/i18n/labels";
import type { MealView } from "../types";

function MealCard({ meal }: { meal: MealView }) {
  const router = useRouter();
  const t = useT();
  const localName = useLocalizedName();
  const title = localName(meal.name ?? mealLabel(t, meal.mealType));
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const result = await deleteMealAction({ mealId: meal.id });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t("meals.deleted"));
      router.refresh();
    });
  }

  return (
    <Card className={cn("p-4 transition-opacity", pending && "opacity-50")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-semibold">
            {title}
            {meal.source === "ai_photo" ? (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[0.65rem] font-bold text-primary-foreground">{t("meals.aiEstimated")}</span>
            ) : null}
          </p>
          <p className="tnum text-sm text-muted-foreground">
            {meal.timeLabel} · {mealLabel(t, meal.mealType)}
          </p>
        </div>
        <div className="text-right">
          <p className="display-md tnum">{Math.round(meal.totals.calories)} kcal</p>
          <p className="tnum text-xs text-muted-foreground">
            {t("macros.short", { p: Math.round(meal.totals.protein), c: Math.round(meal.totals.carbs), f: Math.round(meal.totals.fat) })}
          </p>
        </div>
      </div>

      {meal.photoUrl ? (
        <div className="relative mt-3 aspect-[16/9] overflow-hidden rounded-xl bg-muted">
          <Image src={meal.photoUrl} alt={t("meals.photoAlt")} fill sizes="(max-width: 640px) 100vw, 560px" unoptimized className="object-cover" />
        </div>
      ) : null}

      <ul className="mt-3 flex flex-col gap-1 border-t border-border pt-3 text-sm">
        {meal.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-3">
            <span className="min-w-0 truncate">{localName(item.name)}</span>
            <span className="tnum shrink-0 text-muted-foreground">
              {item.quantity} {unitLabel(t, item.unit)}
              {item.unit === "piece" ? ` · ${Math.round(item.grams)} g` : ""} · {Math.round(item.macros.calories)} kcal
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex justify-end">
        {confirming ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t("meals.deleteQuestion")}</span>
            <button type="button" onClick={remove} disabled={pending} className="rounded-lg bg-destructive px-3 py-1.5 font-semibold text-white">
              {t("meals.delete")}
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="rounded-lg px-3 py-1.5 font-semibold text-muted-foreground">
              {t("meals.keep")}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label={t("meals.deleteAria", { name: title })}
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    </Card>
  );
}

export function MealList({ meals }: { meals: MealView[] }) {
  const t = useT();
  if (meals.length === 0) {
    return <Card className="p-6 text-muted-foreground">{t("meals.empty")}</Card>;
  }
  return (
    <ul className="flex flex-col gap-3">
      {meals.map((meal) => (
        <li key={meal.id}>
          <MealCard meal={meal} />
        </li>
      ))}
    </ul>
  );
}
