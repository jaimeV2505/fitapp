"use client";

import { motion } from "motion/react";
import { Trophy } from "lucide-react";
import { toast } from "sonner";
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
      <span className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        {/* two soft pulses, then still */}
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full bg-primary"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 1.7, opacity: 0 }}
          transition={{ duration: 0.9, repeat: 1, ease: "easeOut" }}
        />
        <motion.span initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={spring.pop} className="relative">
          <Trophy className="size-5" />
        </motion.span>
      </span>
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
