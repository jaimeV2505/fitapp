"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { cn } from "@/lib/utils";

interface GoldPlateProps {
  size?: number;
  /** Plays the sweep of light once. Off: a still plate. */
  shine?: boolean;
  label?: string;
  className?: string;
}

/** The personal-record emblem: a gold weight plate. A band of light crosses it once, then it rests. */
export function GoldPlate({ size = 44, shine = true, label = "PR", className }: GoldPlateProps) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const ticks = Array.from({ length: 16 }, (_, i) => i * 22.5);

  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden className={cn("shrink-0 drop-shadow-[0_2px_6px_rgb(0_0_0/0.35)]", className)}>
      <defs>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--gold-light)" />
          <stop offset="0.42" stopColor="var(--gold)" />
          <stop offset="1" stopColor="var(--gold-deep)" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <circle cx="32" cy="32" r="30" />
        </clipPath>
      </defs>
      <circle cx="32" cy="32" r="30" fill={`url(#${id}-gold)`} />
      <circle cx="32" cy="32" r="30" fill="none" stroke="var(--gold-deep)" strokeOpacity="0.6" strokeWidth="1.5" />
      {ticks.map((angle) => (
        <line key={angle} x1="32" y1="4.5" x2="32" y2="8" stroke="var(--gold-deep)" strokeOpacity="0.55" strokeWidth="1.4" strokeLinecap="round" transform={`rotate(${angle} 32 32)`} />
      ))}
      <circle cx="32" cy="32" r="21" fill="none" stroke="var(--gold-deep)" strokeOpacity="0.55" strokeWidth="1.4" />
      <circle cx="32" cy="32" r="19" fill="var(--gold)" fillOpacity="0.35" />
      <text x="32" y="38.5" textAnchor="middle" fontSize="19" fontWeight="800" fill="var(--gold-deep)" style={{ fontFamily: "var(--font-display), sans-serif" }}>
        {label}
      </text>
      {shine ? (
        <g clipPath={`url(#${id}-clip)`}>
          <motion.g initial={{ x: -50 }} animate={{ x: 90 }} transition={{ duration: 1.1, delay: 0.35, ease: "easeInOut" }}>
            <rect x="0" y="-6" width="14" height="76" fill="white" fillOpacity="0.6" transform="skewX(-20)" />
          </motion.g>
        </g>
      ) : null}
    </svg>
  );
}
