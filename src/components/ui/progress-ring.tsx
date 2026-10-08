"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface ProgressRingProps {
  /** 0-100 */
  percent: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  /** Colour of the progress arc. Defaults to the accent. */
  tone?: "primary" | "success";
  children?: React.ReactNode;
}

export function ProgressRing({
  percent,
  size = 56,
  strokeWidth = 6,
  className,
  tone = "primary",
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth} className="stroke-muted" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={tone === "success" ? "stroke-success" : "stroke-primary"}
          initial={false}
          animate={{ pathLength: clamped / 100 }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </svg>
      {children ? <div className="absolute inset-0 flex items-center justify-center">{children}</div> : null}
    </div>
  );
}
