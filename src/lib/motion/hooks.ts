"use client";

import { useReducedMotion } from "motion/react";
import { useCallback } from "react";

/** True when the user asked for less motion. Use it for things Motion cannot gate by itself (charts, canvas, GSAP). */
export function useMotionSafe(): { reduced: boolean } {
  return { reduced: useReducedMotion() === true };
}

/** Short haptic tick on devices that support it. Never throws, never required. */
export function useHaptics() {
  return useCallback((pattern: number | number[] = 10) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
  }, []);
}
