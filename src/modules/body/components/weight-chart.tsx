"use client";

import { CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatShortDate } from "@/lib/time";
import type { WeightPoint } from "../domain/series";

export function WeightChart({ points }: { points: readonly WeightPoint[] }) {
  if (points.length < 2) {
    return (
      <p className="rounded-xl bg-muted/60 px-4 py-8 text-center text-sm text-muted-foreground">
        Log your weight on two different days to see the trend.
      </p>
    );
  }
  const data = points.map((p) => ({ label: formatShortDate(p.localDate), weight: p.weightKg, average: p.averageKg }));

  return (
    <div className="h-56 w-full" role="img" aria-label="Body weight over time with a 7-day moving average">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} minTickGap={24} />
          <YAxis width={44} tickLine={false} axisLine={false} domain={["dataMin - 0.5", "dataMax + 0.5"]} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
          <Tooltip
            cursor={{ stroke: "var(--border)" }}
            contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--foreground)" }}
            formatter={(value, name) => [`${value} kg`, name === "average" ? "7-day average" : "Weigh-in"]}
          />
          <Line type="monotone" dataKey="weight" stroke="var(--muted-foreground)" strokeWidth={1.5} strokeOpacity={0.6} dot={{ r: 3, fill: "var(--muted-foreground)", strokeWidth: 0 }} activeDot={false} />
          <Line type="monotone" dataKey="average" stroke="var(--primary)" strokeWidth={3.5} dot={false} animationDuration={600} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
