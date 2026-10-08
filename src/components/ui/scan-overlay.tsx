"use client";

import { motion } from "motion/react";

/**
 * Scanner effect over a photo while it is being analysed: corner brackets and a bright line sweeping top to bottom.
 * Purely decorative (the surrounding status text carries the meaning).
 */
export function ScanOverlay({ active }: { active: boolean }) {
  if (!active) return null;
  const corner = "absolute size-6 border-primary";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl bg-black/20">
      <span className={`${corner} left-3 top-3 rounded-tl-lg border-l-[3px] border-t-[3px]`} />
      <span className={`${corner} right-3 top-3 rounded-tr-lg border-r-[3px] border-t-[3px]`} />
      <span className={`${corner} bottom-3 left-3 rounded-bl-lg border-b-[3px] border-l-[3px]`} />
      <span className={`${corner} bottom-3 right-3 rounded-br-lg border-b-[3px] border-r-[3px]`} />
      <motion.div
        className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-transparent via-primary/35 to-transparent"
        initial={{ y: "-60%" }}
        animate={{ y: ["-60%", "420%"] }}
        transition={{ duration: 1.9, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
      >
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary shadow-[0_0_14px_2px_var(--primary)]" />
      </motion.div>
    </div>
  );
}
