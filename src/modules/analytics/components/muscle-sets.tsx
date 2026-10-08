"use client";

import { motion } from "motion/react";
import { useT } from "@/lib/i18n/client";
import { muscleLabel } from "@/lib/i18n/labels";
import type { MuscleSets } from "../types";

/** Completed working sets per muscle this week, as horizontal bars that grow in. */
export function MuscleSetsBars({ rows }: { rows: readonly MuscleSets[] }) {
  const t = useT();
  if (rows.length === 0) {
    return (
      <p className="rounded-2xl bg-muted/60 px-4 py-6 text-center text-sm text-muted-foreground">
        {t("charts.noSetsYet")}
      </p>
    );
  }
  const max = Math.max(...rows.map((row) => row.sets), 1);

  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row, index) => (
        <li key={row.muscle} className="grid grid-cols-[6.5rem_1fr_2rem] items-center gap-3">
          <span className="truncate text-sm font-medium">{muscleLabel(t, row.muscle)}</span>
          <span className="h-3 overflow-hidden rounded-full bg-muted">
            <motion.span
              className="block h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${(row.sets / max) * 100}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 22, delay: index * 0.05 }}
            />
          </span>
          <span className="tnum text-right text-sm font-semibold">{row.sets}</span>
        </li>
      ))}
    </ul>
  );
}
