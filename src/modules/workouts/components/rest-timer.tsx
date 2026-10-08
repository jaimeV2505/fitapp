"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { spring } from "@/lib/motion";
import { formatDuration } from "../domain/format";

export interface RestState {
  /** Stable identity of this rest period (not changed when time is added). */
  id: number;
  /** Epoch milliseconds when the rest ends. */
  endsAt: number;
  totalSeconds: number;
  label: string;
}

interface RestTimerProps {
  rest: RestState;
  onAddSeconds: (seconds: number) => void;
  onDismiss: () => void;
}

/** Floating countdown shown after each completed set. Uses wall-clock time, so it stays correct if the tab sleeps. */
export function RestTimer({ rest, onAddSeconds, onDismiss }: RestTimerProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  const remainingMs = Math.max(0, rest.endsAt - now);
  const finished = remainingMs === 0;

  useEffect(() => {
    if (!finished) return;
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate([180, 80, 180]);
    const id = window.setTimeout(onDismiss, 4000);
    return () => window.clearTimeout(id);
  }, [finished, onDismiss]);

  const fraction = rest.totalSeconds > 0 ? Math.min(1, remainingMs / (rest.totalSeconds * 1000)) : 0;

  return (
    <motion.div
      role="timer"
      aria-live="off"
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 24, opacity: 0 }}
      transition={spring.smooth}
      className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom,0px)+6.25rem)] z-30 mx-auto max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-card md:bottom-6 md:left-[calc(16rem+1rem)]"
    >
      <div className="flex items-center gap-3 p-3 pl-5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-muted-foreground">{finished ? "Rest is over" : "Rest"}</p>
          <motion.p
            className={`font-display tnum text-5xl font-bold leading-none transition-colors ${finished ? "text-success" : ""}`}
            // When the rest is over the time gives two gentle beats, then settles.
            animate={finished ? { scale: [1, 1.08, 1] } : { scale: 1 }}
            transition={finished ? { duration: 0.5, repeat: 1 } : undefined}
          >
            {formatDuration(Math.ceil(remainingMs / 1000))}
          </motion.p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => onAddSeconds(15)} aria-label="Add 15 seconds">
          +15s
        </Button>
        <Button variant={finished ? "primary" : "ghost"} size="sm" onClick={onDismiss}>
          {finished ? "Next set" : "Skip"}
        </Button>
      </div>
      <div className="h-1 w-full bg-muted">
        <div className={`h-full transition-[width] duration-200 ease-linear ${finished ? "bg-success" : "bg-primary"}`} style={{ width: `${fraction * 100}%` }} />
      </div>
    </motion.div>
  );
}
