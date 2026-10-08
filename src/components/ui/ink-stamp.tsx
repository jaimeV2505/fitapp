"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

interface InkStampProps {
  /** Completed sets, printed small under the word. */
  sets: number;
  /** True: the stamp is pressed onto the card now. False: it is already there, faint, like a mark left on the page. */
  animate: boolean;
  className?: string;
}

/**
 * A rubber stamp pressed onto a finished exercise: lands from above, a hair too big, squashes slightly and
 * settles; the ink edges are roughened with a displacement filter so it does not look vector-clean.
 */
export function InkStamp({ sets, animate, className }: InkStampProps) {
  const t = useT();
  const filterId = `ink-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <motion.div
      aria-hidden
      className={cn("pointer-events-none select-none text-success", className)}
      initial={animate ? { scale: 1.9, opacity: 0, rotate: -2 } : false}
      animate={animate ? { scale: [1.9, 0.94, 1], opacity: [0, 1, 1, 0.34], rotate: -9 } : { scale: 1, opacity: 0.34, rotate: -9 }}
      transition={
        animate
          ? {
              scale: { duration: 0.34, times: [0, 0.6, 1], ease: "easeOut" },
              opacity: { duration: 1.7, times: [0, 0.1, 0.55, 1] },
              rotate: { duration: 0.34, ease: "easeOut" },
            }
          : { duration: 0 }
      }
    >
      <svg viewBox="0 0 132 64" width="104" height="50" fill="none">
        <defs>
          <filter id={filterId} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.8" />
          </filter>
        </defs>
        <g filter={`url(#${filterId})`} stroke="currentColor" fill="currentColor">
          <rect x="3" y="3" width="126" height="58" rx="7" strokeWidth="3" fill="none" />
          <rect x="8" y="8" width="116" height="48" rx="4" strokeWidth="1.2" fill="none" />
          <text x="66" y="37" textAnchor="middle" fontSize="30" fontWeight="800" letterSpacing="2" stroke="none" style={{ fontFamily: "var(--font-display), sans-serif" }}>
            {t("stamp.done")}
          </text>
          <text x="66" y="51" textAnchor="middle" fontSize="8.5" fontWeight="700" letterSpacing="1.6" stroke="none" style={{ fontFamily: "var(--font-sans), sans-serif" }}>
            {t("stamp.sets", { count: sets }).toUpperCase()}
          </text>
        </g>
      </svg>
    </motion.div>
  );
}
