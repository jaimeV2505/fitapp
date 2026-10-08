"use client";

import { Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { deleteMealAction } from "../actions";
import { MEAL_LABEL, UNIT_LABEL } from "../labels";
import type { MealView } from "../types";

function MealCard({ meal }: { meal: MealView }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const result = await deleteMealAction({ mealId: meal.id });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Meal deleted");
      router.refresh();
    });
  }

  return (
    <Card className={cn("p-4 transition-opacity", pending && "opacity-50")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-semibold">
            {meal.name ?? MEAL_LABEL[meal.mealType]}
            {meal.source === "ai_photo" ? (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[0.65rem] font-bold text-primary-foreground">AI estimated</span>
            ) : null}
          </p>
          <p className="tnum text-sm text-muted-foreground">
            {meal.timeLabel} · {MEAL_LABEL[meal.mealType]}
          </p>
        </div>
        <div className="text-right">
          <p className="display-md tnum">{Math.round(meal.totals.calories)} kcal</p>
          <p className="tnum text-xs text-muted-foreground">
            P {Math.round(meal.totals.protein)} · C {Math.round(meal.totals.carbs)} · F {Math.round(meal.totals.fat)}
          </p>
        </div>
      </div>

      {meal.photoUrl ? (
        <div className="relative mt-3 aspect-[16/9] overflow-hidden rounded-xl bg-muted">
          <Image src={meal.photoUrl} alt="Meal photo" fill sizes="(max-width: 640px) 100vw, 560px" unoptimized className="object-cover" />
        </div>
      ) : null}

      <ul className="mt-3 flex flex-col gap-1 border-t border-border pt-3 text-sm">
        {meal.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-3">
            <span className="min-w-0 truncate">{item.name}</span>
            <span className="tnum shrink-0 text-muted-foreground">
              {item.quantity} {UNIT_LABEL[item.unit]}
              {item.unit === "piece" ? ` · ${Math.round(item.grams)} g` : ""} · {Math.round(item.macros.calories)} kcal
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex justify-end">
        {confirming ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Delete this meal?</span>
            <button type="button" onClick={remove} disabled={pending} className="rounded-lg bg-destructive px-3 py-1.5 font-semibold text-white">
              Delete
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="rounded-lg px-3 py-1.5 font-semibold text-muted-foreground">
              Keep
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label={`Delete ${meal.name ?? MEAL_LABEL[meal.mealType]}`}
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
  if (meals.length === 0) {
    return <Card className="p-6 text-muted-foreground">Nothing logged for this day yet. Tap “Log meal” to add your first one.</Card>;
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
