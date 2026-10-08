"use client";

import { motion } from "motion/react";
import { sparklinePath, sparklinePoints, trendDirection } from "@/lib/sparkline";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

const WIDTH = 64;
const HEIGHT = 24;

/** Tiny line of the last sessions' heaviest weights. Draws itself once; green when the weight went up. */
export function Sparkline({ values, className }: { values: readonly number[]; className?: string }) {
  const t = useT();
  if (values.length < 2) return null;

  const points = sparklinePoints(values, WIDTH, HEIGHT);
  const last = points[points.length - 1];
  const direction = trendDirection(values);
  const first = values[0] ?? 0;
  const latest = values[values.length - 1] ?? 0;

  return (
    <svg
      role="img"
      aria-label={t("sparkline.aria", { count: values.length, from: first, to: latest })}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width={WIDTH}
      height={HEIGHT}
      fill="none"
      className={cn(direction === "up" ? "text-success" : "text-muted-foreground", className)}
    >
      <motion.path
        d={sparklinePath(points)}
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0.4 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      />
      {last ? <motion.circle cx={last.x} cy={last.y} r={2.4} fill="currentColor" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6, type: "spring", stiffness: 500, damping: 18 }} /> : null}
    </svg>
  );
}
