"use client";

import { MotionConfig } from "motion/react";
import { duration, ease } from "./tokens";

/**
 * Wraps the app once. `reducedMotion="user"` makes Motion honour the OS setting: transform and layout
 * animations are turned off while opacity and colour changes remain, so feedback is still visible.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: duration.base, ease: ease.out }}>
      {children}
    </MotionConfig>
  );
}
