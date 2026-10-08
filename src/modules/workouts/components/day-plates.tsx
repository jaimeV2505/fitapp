"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export const WEEKDAY_SHORT = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const WEEKDAY_LONG = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

/** Each weekday takes the colour of an Olympic plate: red, blue, yellow, green, white. */
const PLATE: Record<number, { disc: string; text: string }> = {
  1: { disc: "bg-plate-red", text: "text-white" },
  2: { disc: "bg-plate-blue", text: "text-white" },
  3: { disc: "bg-plate-yellow", text: "text-[#101640]" },
  4: { disc: "bg-plate-green", text: "text-white" },
  5: { disc: "bg-plate-white", text: "text-[#101640]" },
};
const FALLBACK_PLATE = { disc: "bg-muted", text: "text-foreground" };

export function weekdayLabel(day: { weekday: number | null; name: string }, long = false): string {
  const names = long ? WEEKDAY_LONG : WEEKDAY_SHORT;
  return day.weekday ? (names[day.weekday] ?? day.name) : day.name;
}

interface DayPlatesProps {
  days: readonly { id: string; weekday: number | null; focus: string }[];
  selectedId: string;
  todayId: string | null;
  onSelect: (id: string) => void;
  /** Days with unsaved changes get a marker. */
  markedIds?: ReadonlySet<string>;
}

/** The week as Olympic plates: Mon red, Tue blue, Wed yellow, Thu green, Fri white. */
export function DayPlates({ days, selectedId, todayId, onSelect, markedIds }: DayPlatesProps) {
  return (
    <div role="tablist" aria-label="Training days" className="grid grid-cols-5 gap-2">
      {days.map((day) => {
        const plate = (day.weekday ? PLATE[day.weekday] : undefined) ?? FALLBACK_PLATE;
        const active = day.id === selectedId;
        return (
          <button
            key={day.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(day.id)}
            className="group flex flex-col items-center gap-1.5 outline-offset-4"
          >
            <motion.span
              animate={{ scale: active ? 1.12 : 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 26 }}
              className={cn(
                "relative flex size-14 items-center justify-center rounded-full border border-black/15 sm:size-16",
                plate.disc,
                active && "ring-[3px] ring-foreground ring-offset-2 ring-offset-background",
              )}
            >
              <span aria-hidden className="absolute inset-1.5 rounded-full border border-black/15" />
              <span className={cn("display-md relative", plate.text)}>{day.weekday ? WEEKDAY_SHORT[day.weekday] : "–"}</span>
              {markedIds?.has(day.id) ? <span aria-label="Unsaved changes" className="absolute -right-0.5 -top-0.5 size-3.5 rounded-full border-2 border-background bg-destructive" /> : null}
            </motion.span>
            <span className={cn("max-w-full truncate text-xs font-medium", active ? "text-foreground" : "text-muted-foreground")}>{day.focus}</span>
            <span aria-hidden className={cn("size-1.5 rounded-full", day.id === todayId ? "bg-primary" : "bg-transparent")} />
          </button>
        );
      })}
    </div>
  );
}
