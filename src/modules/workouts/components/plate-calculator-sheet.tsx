"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { NumberField } from "@/components/ui/number-field";
import { Sheet } from "@/components/ui/sheet";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { computePlateLoad, groupPlates, plateStyle, warmupSets } from "../domain/plates";
import { PlateBar } from "./plate-bar";

const BARS = [20, 15, 10] as const;

const DOT: Record<string, string> = {
  red: "bg-plate-red",
  blue: "bg-plate-blue",
  yellow: "bg-plate-yellow",
  green: "bg-plate-green",
  white: "bg-plate-white border border-border",
  steel: "bg-[#97a0b8]",
};

interface PlateCalculatorSheetProps {
  /** Weight in the set editor when it was opened. */
  initialKg: number | null;
  onClose: () => void;
  /** Called with the weight that can actually be loaded. */
  onApply?: (kg: number) => void;
}

/** Plate calculator: type a weight, see the barbell load itself, with the warm-up ramp towards it. */
export function PlateCalculatorSheet({ initialKg, onClose, onApply }: PlateCalculatorSheetProps) {
  const t = useT();
  const [target, setTarget] = useState<number | null>(initialKg && initialKg > 0 ? initialKg : 60);
  const [barKg, setBarKg] = useState<number>(20);

  const load = useMemo(() => computePlateLoad(target ?? 0, barKg), [target, barKg]);
  const groups = groupPlates(load.perSide);
  const warmup = useMemo(() => warmupSets(load.achievedKg, barKg), [load.achievedKg, barKg]);
  const unreachable = target !== null && target > barKg && load.remainderKg > 0;

  return (
    <Sheet
      open
      onOpenChange={(open) => (open ? undefined : onClose())}
      title={t("plates.title")}
      footer={
        onApply ? (
          <Button
            size="lg"
            className="w-full"
            disabled={load.achievedKg <= 0}
            onClick={() => {
              onApply(load.achievedKg);
              onClose();
            }}
          >
            {t("plates.use", { kg: load.achievedKg })}
          </Button>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-[1fr_auto] items-end gap-3">
          <NumberField label={t("plates.target")} suffix="kg" value={target} onChange={setTarget} />
          <div role="radiogroup" aria-label={t("plates.bar")} className="flex h-12 gap-1 rounded-xl bg-muted p-1">
            {BARS.map((bar) => (
              <button
                key={bar}
                type="button"
                role="radio"
                aria-checked={barKg === bar}
                onClick={() => setBarKg(bar)}
                className={cn("tnum min-w-11 rounded-lg px-2 text-sm font-semibold", barKg === bar ? "bg-card text-foreground shadow-card" : "text-muted-foreground")}
              >
                {bar}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3">
          <PlateBar perSide={load.perSide} />
          <p className="mt-1 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("plates.perSide")}</p>
        </div>

        <div>
          {groups.length === 0 ? (
            <p className="font-semibold">{t("plates.bareBar")}</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {groups.map((group) => (
                <li key={group.kg} className="tnum flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-sm font-semibold">
                  <span className={cn("size-3 rounded-full", DOT[plateStyle(group.kg).color])} aria-hidden />
                  {t("plates.group", { count: group.count, kg: group.kg })}
                </li>
              ))}
            </ul>
          )}
          <p className="tnum mt-3 text-lg font-semibold">{t("plates.total", { kg: load.achievedKg })}</p>
          {unreachable ? <p className="mt-1 text-sm text-muted-foreground">{t("plates.closest", { kg: load.achievedKg, target: target ?? 0 })}</p> : null}
        </div>

        <section aria-labelledby="warmup-heading">
          <h3 id="warmup-heading" className="mb-2 text-lg font-semibold">
            {t("plates.warmup")}
          </h3>
          {warmup.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("plates.warmupNone")}</p>
          ) : (
            <ol className="flex flex-col gap-1.5">
              {warmup.map((set, index) => (
                <li key={`${set.kg}-${index}`} className="tnum flex items-center justify-between rounded-xl bg-muted/70 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">{index + 1}</span>
                  <span className="font-semibold">{t("plates.warmupSet", { kg: set.kg, reps: set.reps })}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </Sheet>
  );
}
