"use client";

import { motion } from "motion/react";
import { AnimatedNumber } from "./animated-number";

interface MeterProps {
  label: string;
  value: number;
  target: number | null;
  unit: string;
  /** Tailwind background class for the bar. */
  barClassName?: string;
}

/** Progress toward a target. Without a target it just shows the amount. Over the target the bar stays full. */
export function Meter({ label, value, target, unit, barClassName = "bg-primary" }: MeterProps) {
  const fraction = target && target > 0 ? Math.min(1, value / target) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">
          <AnimatedNumber value={Math.round(value)} className="font-semibold text-foreground" />
          {target ? ` / ${target}` : ""} {unit}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          className={`h-full rounded-full ${barClassName}`}
          initial={false}
          animate={{ width: `${fraction * 100}%` }}
          transition={{ type: "spring", stiffness: 140, damping: 24 }}
        />
      </div>
    </div>
  );
}
