"use client";

import { useState } from "react";
import { useIntlLocale, useT } from "@/lib/i18n/client";
import type { MessageKey } from "@/lib/i18n/types";
import { useMotionSafe } from "@/lib/motion";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatShortDate } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { ExerciseHistoryPoint } from "../types";

type Metric = "weight" | "e1rm" | "volume";

const METRICS: { value: Metric; label: MessageKey; unit: string }[] = [
  { value: "weight", label: "exercise.topWeight", unit: "kg" },
  { value: "e1rm", label: "exercise.est1rm", unit: "kg" },
  { value: "volume", label: "exercise.volume", unit: "kg" },
];

function valueOf(point: ExerciseHistoryPoint, metric: Metric): number | null {
  if (metric === "weight") return point.topWeightKg;
  if (metric === "e1rm") return point.estimated1RmKg;
  return point.totalVolumeKg > 0 ? point.totalVolumeKg : null;
}

export function HistoryChart({ points }: { points: readonly ExerciseHistoryPoint[] }) {
  const [metric, setMetric] = useState<Metric>("weight");
  const { reduced } = useMotionSafe();
  const t = useT();
  const intl = useIntlLocale();
  const active = METRICS.find((m) => m.value === metric) ?? METRICS[0]!;
  const data = points.map((point) => ({ label: formatShortDate(point.localDate, intl), value: valueOf(point, metric) }));
  const plottable = data.filter((d) => d.value !== null).length;

  return (
    <div className="flex flex-col gap-3">
      <div role="radiogroup" aria-label={t("exercise.chartMetric")} className="grid grid-cols-3 gap-1 rounded-2xl bg-muted p-1">
        {METRICS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={metric === option.value}
            onClick={() => setMetric(option.value)}
            className={cn(
              "h-10 rounded-xl text-sm font-semibold transition-colors",
              metric === option.value ? "bg-card text-foreground shadow-card" : "text-muted-foreground",
            )}
          >
            {t(option.label)}
          </button>
        ))}
      </div>

      {plottable < 2 ? (
        <p className="rounded-2xl bg-muted/60 px-4 py-6 text-center text-sm text-muted-foreground">
          {t("exercise.needTwo")}
        </p>
      ) : (
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
              <YAxis
                width={44}
                tickLine={false}
                axisLine={false}
                domain={["auto", "auto"]}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <Tooltip
                cursor={{ stroke: "var(--border)" }}
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  color: "var(--foreground)",
                }}
                formatter={(value) => [`${value} ${active.unit}`, t(active.label)]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--primary)"
                strokeWidth={3}
                dot={{ r: 4, fill: "var(--primary)", strokeWidth: 0 }}
                activeDot={{ r: 6 }}
                connectNulls
                isAnimationActive={!reduced}
                animationDuration={600}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
