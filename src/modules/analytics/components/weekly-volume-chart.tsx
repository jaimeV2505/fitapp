"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useIntlLocale, useT } from "@/lib/i18n/client";
import { formatShortDate } from "@/lib/time";
import type { WeekTotals } from "../types";

export function WeeklyVolumeChart({ weeks }: { weeks: readonly WeekTotals[] }) {
  const t = useT();
  const intl = useIntlLocale();
  const data = weeks.map((week, index) => ({
    label: formatShortDate(week.weekStart, intl),
    volume: week.volumeKg,
    current: index === weeks.length - 1,
  }));
  const hasData = data.some((d) => d.volume > 0);

  if (!hasData) {
    return (
      <p className="rounded-2xl bg-muted/60 px-4 py-8 text-center text-sm text-muted-foreground">
        {t("charts.volumeEmpty")}
      </p>
    );
  }

  return (
    <div className="h-52 w-full" role="img" aria-label={t("charts.volumeAria")}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -8 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
          <YAxis
            width={48}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickFormatter={(value: number) => (value >= 1000 ? `${Math.round(value / 1000)}k` : String(value))}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.5 }}
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              color: "var(--foreground)",
            }}
            formatter={(value) => [`${Number(value).toLocaleString(intl)} kg`, t("charts.volume")]}
            labelFormatter={(label) => t("charts.weekOf", { date: String(label) })}
          />
          <Bar dataKey="volume" radius={[8, 8, 0, 0]} animationDuration={700}>
            {data.map((entry) => (
              <Cell key={entry.label} fill={entry.current ? "var(--primary)" : "var(--muted-foreground)"} fillOpacity={entry.current ? 1 : 0.35} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
