"use client";

import { motion } from "motion/react";
import { listItem, staggerContainer } from "@/lib/motion";

const container = staggerContainer(0.07, 0.04);

/** One orchestrated entrance for a screen: children rise in sequence. Use once per screen. */
export function Stagger({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className={className}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={listItem} className={className}>
      {children}
    </motion.div>
  );
}
