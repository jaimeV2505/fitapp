"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

interface NumberFieldProps {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  suffix?: string;
  decimal?: boolean;
  placeholder?: string;
  className?: string;
  hideLabel?: boolean;
}

function format(value: number | null): string {
  return value === null ? "" : String(Math.round(value * 100) / 100);
}

/** Compact numeric input for forms. Accepts "32,5" and "32.5"; shows exactly what you type while focused. */
export function NumberField({ label, value, onChange, suffix, decimal = true, placeholder = "0", className, hideLabel }: NumberFieldProps) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <div className={className}>
      <label htmlFor={id} className={cn("mb-1.5 block text-sm font-medium text-muted-foreground", hideLabel && "sr-only")}>
        {label}
      </label>
      <div className="relative flex h-12 items-center rounded-xl bg-input focus-within:ring-2 focus-within:ring-ring">
        <input
          id={id}
          inputMode={decimal ? "decimal" : "numeric"}
          autoComplete="off"
          value={draft ?? format(value)}
          placeholder={placeholder}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => {
            const text = event.target.value;
            setDraft(text);
            const normalized = text.trim().replace(",", ".");
            if (normalized === "") return onChange(null);
            const parsed = Number(normalized);
            if (Number.isFinite(parsed) && parsed >= 0) onChange(decimal ? parsed : Math.round(parsed));
          }}
          onBlur={() => setDraft(null)}
          className="tnum h-full w-full min-w-0 bg-transparent px-3 text-lg font-semibold outline-none placeholder:text-muted-foreground"
        />
        {suffix ? <span className="pointer-events-none pr-3 text-sm font-medium text-muted-foreground">{suffix}</span> : null}
      </div>
    </div>
  );
}
