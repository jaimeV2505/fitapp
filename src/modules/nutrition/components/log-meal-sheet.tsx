"use client";

import { ArrowLeft, Camera, Plus, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NumberField } from "@/components/ui/number-field";
import { Sheet } from "@/components/ui/sheet";
import { MEAL_TYPES, QUANTITY_UNITS, type MealType, type QuantityUnit } from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import type { FoodView } from "@/modules/foods/types";
import { gramsFor, macrosFor, resolveTemplateItems, sumMacros, type Macros } from "../domain/macros";
import { logMealAction } from "../actions";
import { MEAL_LABEL, UNIT_LABEL } from "../labels";
import type { TemplateView } from "../types";

interface DraftItem {
  /** Local identity; for template rows this is the template item id (needed for option groups). */
  id: string;
  foodId: string;
  quantity: number | null;
  unit: QuantityUnit;
  optionGroup: string | null;
  isDefaultOption: boolean;
}

interface Draft {
  mealType: MealType;
  templateId: string | null;
  name: string;
  items: DraftItem[];
  choices: Record<string, string>;
}

const EMPTY_DRAFT: Draft = { mealType: "snack", templateId: null, name: "", items: [], choices: {} };

function itemMacros(item: DraftItem, food: FoodView | undefined): Macros | null {
  if (!food || item.quantity === null) return null;
  const grams = gramsFor(food, item.quantity, item.unit);
  return grams === null ? null : macrosFor(food, grams);
}

function templateCalories(template: TemplateView, foodsById: ReadonlyMap<string, FoodView>): number {
  const defaults = resolveTemplateItems(template.items, {});
  return sumMacros(
    defaults.flatMap((item) => {
      const macros = itemMacros(
        { id: item.id, foodId: item.foodId, quantity: item.quantity, unit: item.unit, optionGroup: item.optionGroup, isDefaultOption: item.isDefaultOption },
        foodsById.get(item.foodId),
      );
      return macros ? [macros] : [];
    }),
  ).calories;
}

interface LogMealSheetProps {
  templates: TemplateView[];
  foods: FoodView[];
  /** The day being viewed, YYYY-MM-DD. */
  date: string;
  isToday: boolean;
  /** Opens the camera for an automatic AI estimate. */
  onTakePhoto?: () => void;
}

export function LogMealSheet({ templates, foods, date, isToday, onTakePhoto }: LogMealSheetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"choose" | "edit">("choose");
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [picking, setPicking] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const foodsById = useMemo(() => new Map(foods.map((food) => [food.id, food])), [foods]);
  const visibleItems = useMemo(() => resolveTemplateItems(draft.items, draft.choices), [draft.items, draft.choices]);
  const totals = useMemo(
    () => sumMacros(visibleItems.flatMap((item) => itemMacros(item, foodsById.get(item.foodId)) ?? [])),
    [visibleItems, foodsById],
  );
  const optionGroups = useMemo(() => {
    const groups = new Map<string, DraftItem[]>();
    for (const item of draft.items) {
      if (item.optionGroup !== null) groups.set(item.optionGroup, [...(groups.get(item.optionGroup) ?? []), item]);
    }
    return [...groups.entries()];
  }, [draft.items]);

  const canSave =
    visibleItems.length > 0 &&
    visibleItems.every((item) => item.quantity !== null && item.quantity > 0 && itemMacros(item, foodsById.get(item.foodId)) !== null);

  function openSheet() {
    setStep("choose");
    setDraft(EMPTY_DRAFT);
    setPicking(false);
    setSearch("");
    setError(null);
    setOpen(true);
  }

  function startFromTemplate(template: TemplateView) {
    setDraft({
      mealType: template.mealType,
      templateId: template.id,
      name: template.name,
      choices: {},
      items: template.items.map((item) => ({
        id: item.id,
        foodId: item.foodId,
        quantity: item.quantity,
        unit: item.unit,
        optionGroup: item.optionGroup,
        isDefaultOption: item.isDefaultOption,
      })),
    });
    setStep("edit");
  }

  function startCustom() {
    setDraft(EMPTY_DRAFT);
    setPicking(true);
    setStep("edit");
  }

  function addFood(food: FoodView) {
    const unit: QuantityUnit = food.pieceGrams !== null ? "piece" : "g";
    setDraft((d) => ({
      ...d,
      items: [
        ...d.items,
        { id: `new-${crypto.randomUUID()}`, foodId: food.id, quantity: unit === "piece" ? 1 : 100, unit, optionGroup: null, isDefaultOption: true },
      ],
    }));
    setPicking(false);
    setSearch("");
  }

  function updateItem(id: string, patch: Partial<DraftItem>) {
    setDraft((d) => ({ ...d, items: d.items.map((item) => (item.id === id ? { ...item, ...patch } : item)) }));
  }

  function removeItem(id: string) {
    setDraft((d) => ({ ...d, items: d.items.filter((item) => item.id !== id) }));
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await logMealAction({
        mealType: draft.mealType,
        name: draft.name.trim() === "" ? null : draft.name.trim(),
        templateId: draft.templateId,
        localDate: date,
        items: visibleItems.map((item) => ({ foodId: item.foodId, quantity: item.quantity ?? 0, unit: item.unit })),
      });
      if (!result.ok) return setError(result.error);
      toast.success("Meal logged", { description: `${Math.round(totals.calories)} kcal · ${Math.round(totals.protein)} g protein` });
      setOpen(false);
      router.refresh();
    });
  }

  const pickerFoods = foods.filter((food) => food.name.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 40);

  return (
    <>
      <Button size="lg" className="w-full" onClick={openSheet}>
        <Plus className="size-6" /> Log meal{isToday ? "" : " for this day"}
      </Button>

      <Sheet
        open={open}
        onOpenChange={setOpen}
        title={step === "choose" ? "Log a meal" : picking ? "Add food" : "Your meal"}
        footer={
          step === "edit" && !picking ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <span className="display-md tnum">{Math.round(totals.calories)} kcal</span>
                <span className="tnum text-sm text-muted-foreground">
                  P {Math.round(totals.protein)} · C {Math.round(totals.carbs)} · F {Math.round(totals.fat)}
                </span>
              </div>
              {error ? (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              ) : null}
              <Button size="lg" onClick={save} disabled={!canSave || pending}>
                {pending ? "Saving…" : "Save meal"}
              </Button>
            </div>
          ) : undefined
        }
      >
        {step === "choose" ? (
          <div className="flex flex-col gap-2">
            {onTakePhoto ? (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onTakePhoto();
                }}
                className="flex items-center gap-3 rounded-2xl bg-primary p-4 text-left text-primary-foreground transition-transform active:scale-[0.99]"
              >
                <Camera className="size-6 shrink-0" />
                <span>
                  <span className="block font-semibold">Take a photo</span>
                  <span className="block text-sm opacity-80">Estimate calories and macros automatically, then correct anything.</span>
                </span>
              </button>
            ) : null}
            <p className="mb-1 mt-2 text-sm text-muted-foreground">Or start from one of your templates and adjust the amounts.</p>
            {templates.map((template) => {
              const kcal = templateCalories(template, foodsById);
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => startFromTemplate(template)}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-transform active:scale-[0.99]"
                >
                  <span className="min-w-0">
                    <span className="block font-semibold">{template.name}</span>
                    <span className="block truncate text-sm text-muted-foreground">{template.items.map((i) => i.foodName).join(", ")}</span>
                  </span>
                  <span className="tnum shrink-0 font-semibold">{Math.round(kcal)} kcal</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={startCustom}
              className="flex items-center gap-3 rounded-2xl border border-dashed border-border p-4 text-left font-semibold transition-colors hover:bg-muted"
            >
              <Plus className="size-5" /> Custom meal
            </button>
          </div>
        ) : picking ? (
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search foods"
                aria-label="Search foods"
                className="h-12 w-full rounded-xl bg-input pl-10 pr-3 text-base outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <ul className="flex flex-col gap-1">
              {pickerFoods.map((food) => (
                <li key={food.id}>
                  <button
                    type="button"
                    onClick={() => addFood(food)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-muted"
                  >
                    <span className="min-w-0 truncate font-medium">{food.name}</span>
                    <span className="tnum shrink-0 text-sm text-muted-foreground">{Math.round(food.caloriesPer100)} kcal / 100 g</span>
                  </button>
                </li>
              ))}
              {pickerFoods.length === 0 ? <li className="px-3 py-6 text-center text-sm text-muted-foreground">No foods match. Add it in Manage foods.</li> : null}
            </ul>
            {draft.items.length > 0 ? (
              <Button variant="ghost" onClick={() => setPicking(false)}>
                <ArrowLeft className="size-4" /> Back to meal
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Meal type">
              {MEAL_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={draft.mealType === type}
                  onClick={() => setDraft((d) => ({ ...d, mealType: type }))}
                  className={cn(
                    "h-10 rounded-full px-4 text-sm font-semibold transition-colors",
                    draft.mealType === type ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  {MEAL_LABEL[type]}
                </button>
              ))}
            </div>

            {optionGroups.map(([group, options]) => {
              const selected = resolveTemplateItems(draft.items, draft.choices).find((i) => i.optionGroup === group)?.id;
              return (
                <div key={group}>
                  <p className="mb-1.5 text-sm font-medium capitalize text-muted-foreground">{group}</p>
                  <div role="radiogroup" aria-label={group} className="flex gap-2">
                    {options.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        role="radio"
                        aria-checked={selected === option.id}
                        onClick={() => setDraft((d) => ({ ...d, choices: { ...d.choices, [group]: option.id } }))}
                        className={cn(
                          "h-11 flex-1 rounded-xl px-3 text-sm font-semibold transition-colors",
                          selected === option.id ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {foodsById.get(option.foodId)?.name ?? "Unknown"}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            <ul className="flex flex-col gap-3">
              {visibleItems.map((item) => {
                const food = foodsById.get(item.foodId);
                const macros = itemMacros(item, food);
                const hasPiece = food !== undefined && food.pieceGrams !== null;
                const units = QUANTITY_UNITS.filter((u) => u !== "piece" || hasPiece);
                return (
                  <li key={item.id} className="rounded-2xl border border-border bg-card p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 font-semibold">{food?.name ?? "Unknown food"}</p>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        aria-label={`Remove ${food?.name ?? "food"}`}
                        className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <div className="mt-2 flex items-end gap-2">
                      <NumberField
                        className="flex-1"
                        label={`Amount of ${food?.name ?? "food"}`}
                        hideLabel
                        value={item.quantity}
                        onChange={(quantity) => updateItem(item.id, { quantity })}
                        decimal={item.unit === "g" || item.unit === "ml"}
                      />
                      <div role="radiogroup" aria-label="Unit" className="flex h-12 gap-1 rounded-xl bg-muted p-1">
                        {units.map((unit) => (
                          <button
                            key={unit}
                            type="button"
                            role="radio"
                            aria-checked={item.unit === unit}
                            onClick={() => updateItem(item.id, { unit })}
                            className={cn(
                              "rounded-lg px-3 text-sm font-semibold transition-colors",
                              item.unit === unit ? "bg-card text-foreground" : "text-muted-foreground",
                            )}
                          >
                            {unit === "piece" ? (food?.pieceLabel ?? "pcs") : UNIT_LABEL[unit]}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="tnum mt-2 text-sm text-muted-foreground">
                      {macros
                        ? `${Math.round(macros.calories)} kcal · P ${Math.round(macros.protein)} · C ${Math.round(macros.carbs)} · F ${Math.round(macros.fat)}`
                        : "Enter an amount"}
                    </p>
                  </li>
                );
              })}
            </ul>

            <Button variant="secondary" onClick={() => setPicking(true)}>
              <Plus className="size-5" /> Add food
            </Button>
          </div>
        )}
      </Sheet>
    </>
  );
}
