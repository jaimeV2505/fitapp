"use client";

import { motion } from "motion/react";
import { spring } from "@/lib/motion";
import { useT } from "@/lib/i18n/client";
import { plateStyle, type PlateColor } from "../domain/plates";

const FILL: Record<PlateColor, string> = {
  red: "var(--plate-red)",
  blue: "var(--plate-blue)",
  yellow: "var(--plate-yellow)",
  green: "var(--plate-green)",
  white: "var(--plate-white)",
  steel: "#97a0b8",
};

const SLEEVE_START = 176;
const SLEEVE_END = 336;
const GAP = 1.5;

/**
 * One side of a loaded barbell. Plates slide onto the sleeve one after another, heaviest first, in their
 * Olympic colours. The other side is identical, so only one is drawn.
 */
export function PlateBar({ perSide }: { perSide: readonly number[] }) {
  const t = useT();

  const widths = perSide.map((kg) => 5 + plateStyle(kg).size * 9);
  const total = widths.reduce((sum, w) => sum + w + GAP, 0);
  const available = SLEEVE_END - SLEEVE_START - 14;
  const scale = total > available ? available / total : 1;

  const laid = perSide.reduce<{ items: { kg: number; style: ReturnType<typeof plateStyle>; width: number; height: number; x: number; key: string }[]; end: number }>(
    (acc, kg, index) => {
      const style = plateStyle(kg);
      const width = (widths[index] ?? 8) * scale;
      const item = { kg, style, width, height: 108 * style.size, x: acc.end, key: `${index}-${kg}` };
      return { items: [...acc.items, item], end: acc.end + width + GAP * scale };
    },
    { items: [], end: SLEEVE_START + 4 },
  );
  const plates = laid.items;
  const cursor = laid.end;

  return (
    <svg viewBox="0 0 340 120" role="img" aria-label={t("plates.barAria", { count: perSide.length })} className="w-full">
      {/* grip with knurling */}
      <rect x="0" y="54" width="150" height="12" rx="2" fill="#6f7894" />
      {Array.from({ length: 20 }, (_, i) => (
        <line key={i} x1={14 + i * 6} y1="54" x2={14 + i * 6} y2="66" stroke="#4d5572" strokeWidth="1" />
      ))}
      {/* inner collar and sleeve */}
      <rect x="150" y="48" width="8" height="24" rx="2" fill="#aab2c8" />
      <rect x="158" y="56" width={SLEEVE_END - 158} height="8" rx="1" fill="#c7cdde" />

      {plates.map((plate, index) => (
        <motion.g key={plate.key} initial={{ x: 70, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ ...spring.snappy, delay: index * 0.07 }}>
          <rect
            x={plate.x}
            y={60 - plate.height / 2}
            width={plate.width}
            height={plate.height}
            rx={3}
            fill={FILL[plate.style.color]}
            stroke="rgb(0 0 0 / 0.35)"
            strokeWidth="1"
          />
          <rect x={plate.x + 1.5} y={60 - plate.height / 2 + 3} width={Math.max(plate.width - 3, 1)} height="3" rx="1.5" fill="white" fillOpacity="0.35" />
        </motion.g>
      ))}

      {/* outer collar */}
      <motion.rect
        x={cursor + 1}
        y="49"
        width="9"
        height="22"
        rx="2"
        fill="#aab2c8"
        stroke="rgb(0 0 0 / 0.25)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: plates.length * 0.07 + 0.1 }}
      />
    </svg>
  );
}
