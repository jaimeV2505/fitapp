"use client";

import { motion } from "motion/react";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import { spring } from "@/lib/motion";

interface NumberStepperProps {
  label: string;
  unit?: string;
  value: number | null;
  step: number;
  min?: number;
  max?: number;
  /** Allow decimals (weight). Reps are whole numbers. */
  decimal?: boolean;
  onChange: (value: number | null) => void;
}

function format(value: number | null): string {
  return value === null ? "" : String(Math.round(value * 100) / 100);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value * 100) / 100));
}

/** Parses "32,5" and "32.5". Returns undefined for text that is not a number yet (e.g. "-" or "3."). */
function parse(text: string): number | null | undefined {
  const normalized = text.trim().replace(",", ".");
  if (normalized === "") return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

const stepButton =
  "flex size-14 shrink-0 items-center justify-center rounded-2xl bg-muted text-foreground disabled:opacity-40";

export function NumberStepper({ label, unit, value, step, min = 0, max = 999, decimal = false, onChange }: NumberStepperProps) {
  // While the field is focused we show exactly what was typed; otherwise the formatted value.
  const [draft, setDraft] = useState<string | null>(null);
  const t = useT();
  const shown = draft ?? format(value);

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <motion.button
          type="button"
          whileTap={{ scale: 0.88 }}
          transition={spring.snappy}
          aria-label={t("stepper.decrease", { label: label.toLowerCase() })}
          className={stepButton}
          disabled={value !== null && value <= min}
          onClick={() => onChange(clamp((value ?? 0) - step, min, max))}
        >
          <Minus className="size-6" />
        </motion.button>
        <label className="relative flex h-14 min-w-0 flex-1 items-center justify-center rounded-2xl bg-input">
          <input
            aria-label={label}
            inputMode={decimal ? "decimal" : "numeric"}
            enterKeyHint="done"
            autoComplete="off"
            value={shown}
            placeholder="–"
            onFocus={(event) => event.currentTarget.select()}
            onChange={(event) => {
              const text = event.target.value;
              setDraft(text);
              const parsed = parse(text);
              if (parsed === null) onChange(null);
              else if (parsed !== undefined) onChange(clamp(decimal ? parsed : Math.round(parsed), min, max));
            }}
            onBlur={() => setDraft(null)}
            className="font-display tnum h-full w-full min-w-0 bg-transparent text-center text-5xl font-bold outline-none placeholder:text-muted-foreground"
          />
          {unit ? (
            <span className={cn("pointer-events-none absolute right-3 text-sm font-medium text-muted-foreground")}>{unit}</span>
          ) : null}
        </label>
        <motion.button
          type="button"
          whileTap={{ scale: 0.88 }}
          transition={spring.snappy}
          aria-label={t("stepper.increase", { label: label.toLowerCase() })}
          className={stepButton}
          disabled={value !== null && value >= max}
          onClick={() => onChange(clamp((value ?? 0) + step, min, max))}
        >
          <Plus className="size-6" />
        </motion.button>
      </div>
    </div>
  );
}
