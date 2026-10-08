"use client";

import NumberFlow from "@number-flow/react";
import { animate, useMotionValue, useTransform, motion } from "motion/react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface AnimatedNumberProps {
  value: number;
  suffix?: string;
  decimals?: number;
  className?: string;
}

/** Digits roll to the new value whenever it changes (live counters). */
export function AnimatedNumber({ value, suffix, decimals = 0, className }: AnimatedNumberProps) {
  return (
    <NumberFlow
      value={value}
      suffix={suffix}
      format={{ maximumFractionDigits: decimals, minimumFractionDigits: 0 }}
      className={cn("tnum", className)}
    />
  );
}

/** Counts up from zero once when it first appears (summary screens). */
export function CountUp({ value, suffix = "", className, locale = "en-US" }: { value: number; suffix?: string; className?: string; locale?: string }) {
  const motionValue = useMotionValue(0);
  const text = useTransform(motionValue, (latest) => `${Math.round(latest).toLocaleString(locale)}${suffix}`);

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 0.9, ease: "easeOut" });
    return () => controls.stop();
  }, [motionValue, value]);

  return <motion.span className={cn("tnum", className)}>{text}</motion.span>;
}
