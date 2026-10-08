"use client";

import { Pencil, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NumberField } from "@/components/ui/number-field";
import { Sheet } from "@/components/ui/sheet";
import { useLocalizedName, useT } from "@/lib/i18n/client";
import { deleteFoodAction, saveFoodAction } from "../actions";
import type { FoodView } from "../types";

interface Draft {
  id?: string;
  name: string;
  brand: string;
  caloriesPer100: number | null;
  proteinPer100: number | null;
  carbsPer100: number | null;
  fatPer100: number | null;
  pieceLabel: string;
  pieceGrams: number | null;
  isBuiltIn: boolean;
}

const BLANK: Draft = {
  name: "",
  brand: "",
  caloriesPer100: null,
  proteinPer100: null,
  carbsPer100: null,
  fatPer100: null,
  pieceLabel: "",
  pieceGrams: null,
  isBuiltIn: false,
};

const textInput = "h-12 w-full rounded-xl bg-input px-3 text-base outline-none focus:ring-2 focus:ring-ring";

function toDraft(food: FoodView): Draft {
  return {
    id: food.id,
    name: food.name,
    brand: food.brand ?? "",
    caloriesPer100: food.caloriesPer100,
    proteinPer100: food.proteinPer100,
    carbsPer100: food.carbsPer100,
    fatPer100: food.fatPer100,
    pieceLabel: food.pieceLabel ?? "",
    pieceGrams: food.pieceGrams,
    isBuiltIn: food.isBuiltIn,
  };
}

export function FoodsManager({ foods }: { foods: FoodView[] }) {
  const router = useRouter();
  const t = useT();
  const localName = useLocalizedName();
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const shown = foods.filter((food) => {
    const q = query.trim().toLowerCase();
    return food.name.toLowerCase().includes(q) || localName(food.name).toLowerCase().includes(q);
  });

  function save() {
    if (!draft) return;
    setError(null);
    startTransition(async () => {
      const result = await saveFoodAction({
        id: draft.id,
        name: draft.name,
        brand: draft.brand.trim() === "" ? null : draft.brand,
        caloriesPer100: draft.caloriesPer100 ?? 0,
        proteinPer100: draft.proteinPer100 ?? 0,
        carbsPer100: draft.carbsPer100 ?? 0,
        fatPer100: draft.fatPer100 ?? 0,
        pieceLabel: draft.pieceLabel.trim() === "" ? null : draft.pieceLabel,
        pieceGrams: draft.pieceLabel.trim() === "" ? null : draft.pieceGrams,
      });
      if (!result.ok) return setError(result.error);
      toast.success(draft.id ? t("foodsManager.updated") : t("foodsManager.added"));
      setDraft(null);
      router.refresh();
    });
  }

  function remove() {
    const id = draft?.id;
    if (!id) return;
    startTransition(async () => {
      const result = await deleteFoodAction({ id });
      if (!result.ok) return setError(result.error);
      toast.success(t("foodsManager.deleted"));
      setDraft(null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("foodsManager.search")}
            aria-label={t("foodsManager.search")}
            className={`${textInput} pl-10`}
          />
        </div>
        <Button
          onClick={() => {
            setError(null);
            setDraft(BLANK);
          }}
        >
          <Plus className="size-5" /> {t("foodsManager.new")}
        </Button>
      </div>

      <ul className="flex flex-col gap-2">
        {shown.map((food) => (
          <li key={food.id}>
            <Card className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{localName(food.name)}</p>
                <p className="tnum truncate text-sm text-muted-foreground">
                  {t("foodsManager.line", { kcal: Math.round(food.caloriesPer100), p: food.proteinPer100, c: food.carbsPer100, f: food.fatPer100 })}
                  {food.pieceLabel && food.pieceGrams ? t("foodsManager.piece", { label: localName(food.pieceLabel), grams: food.pieceGrams }) : ""}
                </p>
                {food.nutritionSource === "seed_estimate" ? (
                  <p className="text-xs text-muted-foreground">{t("foodsManager.estimate")}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setDraft(toDraft(food));
                }}
                aria-label={t("foodsManager.edit", { name: localName(food.name) })}
                className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <Pencil className="size-5" />
              </button>
            </Card>
          </li>
        ))}
        {shown.length === 0 ? <li className="py-8 text-center text-muted-foreground">{t("foodsManager.noMatch", { query })}</li> : null}
      </ul>

      {draft ? (
        <Sheet
          open
          onOpenChange={(open) => {
            if (!open) setDraft(null);
          }}
          title={draft.id ? t("foodsManager.editFood") : t("foodsManager.newFood")}
          footer={
            <div className="flex flex-col gap-2">
              {error ? (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              ) : null}
              <Button size="lg" onClick={save} disabled={pending || draft.name.trim() === ""}>
                {pending ? t("foodsManager.saving") : t("foodsManager.save")}
              </Button>
              {draft.id && !draft.isBuiltIn ? (
                <Button variant="ghost" onClick={remove} disabled={pending}>
                  {t("foodsManager.deleteFood")}
                </Button>
              ) : null}
            </div>
          }
        >
          <div className="flex flex-col gap-4">
            {draft.isBuiltIn ? (
              <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                {t("foodsManager.builtIn")}
              </p>
            ) : null}
            <div>
              <label htmlFor="food-name" className="mb-1.5 block text-sm font-medium text-muted-foreground">
                {t("foodsManager.name")}
              </label>
              <input id="food-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={textInput} maxLength={80} />
            </div>
            <div>
              <label htmlFor="food-brand" className="mb-1.5 block text-sm font-medium text-muted-foreground">
                {t("foodsManager.brand")}
              </label>
              <input id="food-brand" value={draft.brand} onChange={(e) => setDraft({ ...draft, brand: e.target.value })} className={textInput} maxLength={60} />
            </div>
            <p className="text-sm font-semibold">{t("foodsManager.per100")}</p>
            <div className="grid grid-cols-2 gap-3">
              <NumberField label={t("nutrition.calories")} suffix="kcal" value={draft.caloriesPer100} onChange={(v) => setDraft({ ...draft, caloriesPer100: v })} />
              <NumberField label={t("nutrition.protein")} suffix="g" value={draft.proteinPer100} onChange={(v) => setDraft({ ...draft, proteinPer100: v })} />
              <NumberField label={t("nutrition.carbs")} suffix="g" value={draft.carbsPer100} onChange={(v) => setDraft({ ...draft, carbsPer100: v })} />
              <NumberField label={t("nutrition.fat")} suffix="g" value={draft.fatPer100} onChange={(v) => setDraft({ ...draft, fatPer100: v })} />
            </div>
            <p className="text-sm font-semibold">{t("foodsManager.naturalPiece")}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="food-piece" className="mb-1.5 block text-sm font-medium text-muted-foreground">
                  {t("foodsManager.pieceName")}
                </label>
                <input id="food-piece" value={draft.pieceLabel} onChange={(e) => setDraft({ ...draft, pieceLabel: e.target.value })} className={textInput} maxLength={24} />
              </div>
              <NumberField label={t("foodsManager.pieceWeight")} suffix="g" value={draft.pieceGrams} onChange={(v) => setDraft({ ...draft, pieceGrams: v })} />
            </div>
          </div>
        </Sheet>
      ) : null}
    </div>
  );
}
