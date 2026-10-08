"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NumberField } from "@/components/ui/number-field";
import { Sheet } from "@/components/ui/sheet";
import { logMeasurementAction } from "../actions";

interface Draft {
  weightKg: number | null;
  bodyFatPercent: number | null;
  waistCm: number | null;
  chestCm: number | null;
  armCm: number | null;
  legCm: number | null;
}

const EMPTY: Draft = { weightKg: null, bodyFatPercent: null, waistCm: null, chestCm: null, armCm: null, legCm: null };

export function LogMeasurementButton({ lastWeightKg }: { lastWeightKg: number | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [more, setMore] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const hasAny = Object.values(draft).some((v) => v !== null);

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await logMeasurementAction(draft);
      if (!result.ok) return setError(result.error);
      toast.success("Saved");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button
        size="lg"
        className="w-full"
        onClick={() => {
          setDraft(EMPTY);
          setMore(false);
          setError(null);
          setOpen(true);
        }}
      >
        <Plus className="size-6" /> Log weight
      </Button>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        title="Log body data"
        footer={
          <div className="flex flex-col gap-2">
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <Button size="lg" onClick={save} disabled={pending || !hasAny}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <NumberField label="Body weight" suffix="kg" value={draft.weightKg} onChange={(weightKg) => setDraft((d) => ({ ...d, weightKg }))} placeholder={lastWeightKg ? String(lastWeightKg) : "0"} />
          <button type="button" onClick={() => setMore((m) => !m)} className="text-left text-sm font-semibold text-muted-foreground underline-offset-4 hover:underline">
            {more ? "Hide measurements" : "Add measurements (waist, arm, chest, leg, body fat)"}
          </button>
          {more ? (
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Waist" suffix="cm" value={draft.waistCm} onChange={(waistCm) => setDraft((d) => ({ ...d, waistCm }))} />
              <NumberField label="Chest" suffix="cm" value={draft.chestCm} onChange={(chestCm) => setDraft((d) => ({ ...d, chestCm }))} />
              <NumberField label="Arm" suffix="cm" value={draft.armCm} onChange={(armCm) => setDraft((d) => ({ ...d, armCm }))} />
              <NumberField label="Leg" suffix="cm" value={draft.legCm} onChange={(legCm) => setDraft((d) => ({ ...d, legCm }))} />
              <NumberField label="Body fat" suffix="%" value={draft.bodyFatPercent} onChange={(bodyFatPercent) => setDraft((d) => ({ ...d, bodyFatPercent }))} />
            </div>
          ) : null}
        </div>
      </Sheet>
    </>
  );
}
