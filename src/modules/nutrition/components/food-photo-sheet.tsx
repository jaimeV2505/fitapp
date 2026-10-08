"use client";

import { Camera, LoaderCircle, RotateCcw, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useImperativeHandle, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NumberField } from "@/components/ui/number-field";
import { Sheet } from "@/components/ui/sheet";
import { MEAL_TYPES, type ConfidenceLevel, type MealType } from "@/lib/db/schema/enums";
import { resizeImage } from "@/lib/image";
import { useT } from "@/lib/i18n/client";
import { mealLabel } from "@/lib/i18n/labels";
import { cn } from "@/lib/utils";
import { levelFromScore, scaleItemToGrams, type EstimatedItem } from "@/modules/ai/domain/food-estimate";
import { analyzeFoodPhotoAction, saveAiMealAction } from "../actions";
import { sumMacros } from "../domain/macros";

type Step = "preview" | "analyzing" | "review";

interface Row extends EstimatedItem {
  key: string;
}

const CONFIDENCE_TONE: Record<ConfidenceLevel, string> = {
  high: "bg-success-soft text-success",
  medium: "bg-plate-yellow/20 text-foreground",
  low: "bg-destructive/15 text-destructive",
};

function defaultMealType(): MealType {
  const hour = new Date().getHours();
  if (hour < 11) return "breakfast";
  if (hour < 15) return "lunch";
  if (hour < 18) return "snack";
  return "dinner";
}

function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  const t = useT();
  return <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", CONFIDENCE_TONE[level])}>{t("confidence.badge", { level: t(`confidence.${level}`) })}</span>;
}

export interface PhotoControl {
  /** Opens the camera (or photo picker). Call it from a tap handler. */
  openCamera: () => void;
}

/** Camera -> Claude estimate -> you review and edit everything -> save. Nothing is saved before you confirm. */
export function FoodPhotoButton({ date, controlRef }: { date: string; controlRef?: React.Ref<PhotoControl> }) {
  const router = useRouter();
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("preview");
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hint, setHint] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [overall, setOverall] = useState<ConfidenceLevel>("medium");
  const [notes, setNotes] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [pending, startTransition] = useTransition();

  // Release the preview's object URL when it is replaced or the component goes away.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useImperativeHandle(controlRef, () => ({ openCamera: () => inputRef.current?.click() }), []);

  const totals = useMemo(() => sumMacros(rows), [rows]);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      const resized = await resizeImage(file);
      setPhoto(resized);
      setPreviewUrl(URL.createObjectURL(resized));
      setHint("");
      setStep("preview");
      setMealType(defaultMealType());
      setOpen(true);
    } catch {
      toast.error(t("photo.readFail"));
    }
  }

  function analyze() {
    if (!photo) return;
    setError(null);
    setStep("analyzing");
    startTransition(async () => {
      const form = new FormData();
      form.set("photo", new File([photo], "meal.jpg", { type: "image/jpeg" }));
      if (hint.trim()) form.set("hint", hint.trim());
      const result = await analyzeFoodPhotoAction(form);
      if (!result.ok) {
        setError(result.error);
        setStep("preview");
        return;
      }
      setAnalysisId(result.data.analysisId);
      setOverall(result.data.estimate.confidence);
      setNotes(result.data.estimate.notes);
      setRows(result.data.estimate.items.map((item) => ({ ...item, key: crypto.randomUUID() })));
      setStep("review");
    });
  }

  function update(key: string, patch: Partial<EstimatedItem>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function save() {
    if (!analysisId) return;
    setError(null);
    startTransition(async () => {
      const result = await saveAiMealAction({
        analysisId,
        mealType,
        localDate: date,
        items: rows.map((row) => ({
          name: row.name,
          grams: row.grams,
          calories: row.calories,
          protein: row.protein,
          carbs: row.carbs,
          fat: row.fat,
          confidence: row.confidence,
        })),
      });
      if (!result.ok) return setError(result.error);
      toast.success(t("photo.saved"), { description: t("photo.savedSummary", { kcal: Math.round(totals.calories) }) });
      setOpen(false);
      router.refresh();
    });
  }

  const valid = rows.length > 0 && rows.every((row) => row.name.trim() !== "" && row.grams > 0);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        aria-label={t("photo.takeAria")}
        onChange={(event) => {
          void onFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <Button size="lg" variant="secondary" className="w-full" onClick={() => inputRef.current?.click()}>
        <Camera className="size-6" /> Food photo
      </Button>

      <Sheet
        open={open}
        onOpenChange={setOpen}
        title={step === "review" ? t("photo.review") : t("photo.title")}
        footer={
          step === "preview" ? (
            <div className="flex flex-col gap-2">
              {error ? (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              ) : null}
              <Button size="lg" onClick={analyze} disabled={pending || !photo}>
                {t("photo.estimate")}
              </Button>
              <Button variant="ghost" onClick={() => inputRef.current?.click()}>
                <RotateCcw className="size-4" /> {t("photo.retake")}
              </Button>
            </div>
          ) : step === "review" ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <span className="display-md tnum">{Math.round(totals.calories)} kcal</span>
                <span className="tnum text-sm text-muted-foreground">
                  {t("macros.short", { p: Math.round(totals.protein), c: Math.round(totals.carbs), f: Math.round(totals.fat) })}
                </span>
              </div>
              {error ? (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              ) : null}
              <Button size="lg" onClick={save} disabled={pending || !valid}>
                {pending ? t("photo.saving") : t("photo.saveMeal")}
              </Button>
            </div>
          ) : undefined
        }
      >
        {step !== "review" && previewUrl ? (
          <div className="flex flex-col gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- local object URL, not optimizable */}
            <img src={previewUrl} alt={t("photo.alt")} className="aspect-[4/3] w-full rounded-2xl object-cover" />
            {step === "analyzing" ? (
              <div role="status" className="flex items-center justify-center gap-3 py-4 text-muted-foreground">
                <LoaderCircle className="size-5 animate-spin" /> {t("photo.estimating")}
              </div>
            ) : (
              <div>
                <label htmlFor="photo-hint" className="mb-1.5 block text-sm font-medium text-muted-foreground">
                  {t("photo.hintLabel")}
                </label>
                <input
                  id="photo-hint"
                  value={hint}
                  onChange={(event) => setHint(event.target.value)}
                  placeholder={t("photo.hintPlaceholder")}
                  maxLength={200}
                  className="h-12 w-full rounded-xl bg-input px-3 text-base outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}
          </div>
        ) : null}

        {step === "review" ? (
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">{t("meals.aiEstimated")}</span>
                <ConfidenceBadge level={overall} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("photo.warning")}
              </p>
              {notes ? <p className="mt-2 text-sm">{notes}</p> : null}
            </div>

            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("logMeal.mealType")}>
              {MEAL_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={mealType === type}
                  onClick={() => setMealType(type)}
                  className={cn("h-10 rounded-full px-4 text-sm font-semibold transition-colors", mealType === type ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
                >
                  {mealLabel(t, type)}
                </button>
              ))}
            </div>

            <ul className="flex flex-col gap-3">
              {rows.map((row) => (
                <li key={row.key} className="rounded-2xl border border-border bg-card p-3">
                  <div className="flex items-center gap-2">
                    <input
                      value={row.name}
                      onChange={(event) => update(row.key, { name: event.target.value })}
                      aria-label={t("photo.foodName")}
                      maxLength={80}
                      className="h-11 min-w-0 flex-1 rounded-xl bg-input px-3 font-semibold outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button
                      type="button"
                      onClick={() => setRows((current) => current.filter((r) => r.key !== row.key))}
                      aria-label={t("photo.remove", { name: row.name })}
                      className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <div className="mt-1.5">
                    <ConfidenceBadge level={levelFromScore(row.confidence)} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <NumberField label={t("photo.weight")} suffix="g" value={row.grams} onChange={(v) => setRows((cur) => cur.map((r) => (r.key === row.key ? scaledRow(r, v ?? 0) : r)))} />
                    <NumberField label={t("nutrition.calories")} suffix="kcal" value={row.calories} onChange={(v) => update(row.key, { calories: v ?? 0 })} />
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <NumberField label={t("nutrition.protein")} suffix="g" value={row.protein} onChange={(v) => update(row.key, { protein: v ?? 0 })} />
                    <NumberField label={t("nutrition.carbs")} suffix="g" value={row.carbs} onChange={(v) => update(row.key, { carbs: v ?? 0 })} />
                    <NumberField label={t("nutrition.fat")} suffix="g" value={row.fat} onChange={(v) => update(row.key, { fat: v ?? 0 })} />
                  </div>
                </li>
              ))}
            </ul>
            {rows.length === 0 ? <p className="text-center text-sm text-muted-foreground">{t("photo.noneLeft")}</p> : null}
          </div>
        ) : null}
      </Sheet>
    </>
  );
}

/** Changing the weight rescales the item's calories and macros; you can still overwrite each number afterwards. */
function scaledRow(row: Row, grams: number): Row {
  return grams > 0 ? { ...scaleItemToGrams(row, grams), key: row.key } : { ...row, grams };
}
