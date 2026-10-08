"use client";

import { motion } from "motion/react";
import { distance, duration, ease } from "@/lib/motion";

/**
 * Re-mounts on every navigation. A short fade and rise (opacity-only when reduced motion is on)
 * makes route changes feel continuous without delaying content.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: distance.small }} animate={{ opacity: 1, y: 0 }} transition={{ duration: duration.base, ease: ease.out }}>
      {children}
    </motion.div>
  );
}
