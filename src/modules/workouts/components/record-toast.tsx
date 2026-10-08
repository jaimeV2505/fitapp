"use client";

import { motion } from "motion/react";
import { toast } from "sonner";
import { GoldPlate } from "@/components/ui/gold-plate";
import { useT } from "@/lib/i18n/client";
import { spring } from "@/lib/motion";
import type { RecordHit } from "../domain/records";

function RecordToast({ exercise, hit }: { exercise: string; hit: RecordHit }) {
  const t = useT();
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={spring.smooth}
      className="flex w-[min(92vw,22rem)] items-center gap-3 rounded-2xl border border-primary/60 bg-card p-3 text-card-foreground shadow-card"
      role="status"
    >
      <GoldPlate size={46} />
      <span className="min-w-0">
        <span className="block font-semibold">{t("recordToast.title")}</span>
        <span className="block truncate text-sm text-muted-foreground">
          {hit.kind === "weight"
            ? t("recordToast.weight", { exercise, weight: hit.weightKg, reps: hit.reps })
            : t("recordToast.e1rm", { exercise, value: hit.valueKg })}
        </span>
      </span>
    </motion.div>
  );
}

export function showRecordToast(exercise: string, hit: RecordHit): void {
  toast.custom(() => <RecordToast exercise={exercise} hit={hit} />, { duration: 5200 });
}
