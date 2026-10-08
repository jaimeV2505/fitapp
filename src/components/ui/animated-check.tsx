"use client";

import { motion } from "motion/react";
import { duration, ease } from "@/lib/motion";

/** A check mark that draws itself. Pass animate={false} to render it already drawn. */
export function AnimatedCheck({ className, strokeWidth = 3, animate = true }: { className?: string; strokeWidth?: number; animate?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <motion.path
        d="M5 12.5l4.5 4.5L19 7.5"
        initial={animate ? { pathLength: 0 } : false}
        animate={{ pathLength: 1 }}
        transition={{ duration: duration.base + 0.06, ease: ease.out }}
      />
    </svg>
  );
}
