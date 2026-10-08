"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n/client";
import { muscleLabel } from "@/lib/i18n/labels";
import { cn } from "@/lib/utils";
import { HEAT_LEGEND, buildHeatMap } from "../domain/heat";
import type { MuscleSets } from "../types";

const HeatMapModel = dynamic(() => import("./heat-map-model"), { ssr: false, loading: () => <Skeleton className="h-72 w-full" /> });

const SWATCH = ["bg-muted", "bg-[#4c7bea]", "bg-[#2fb56f]", "bg-[#f4c531]", "bg-[#f08a24]", "bg-[#e5483d]"] as const;

/** The body, heated by this week's completed sets per muscle, with the hottest muscles listed under it. */
export function MuscleHeatMap({ rows }: { rows: readonly MuscleSets[] }) {
  const t = useT();
  const cells = buildHeatMap(rows);
  const hottest = [...cells].filter((c) => c.sets > 0).sort((a, b) => b.sets - a.sets).slice(0, 3);

  return (
    <div className="flex flex-col gap-4">
      <div role="img" aria-label={t("heat.aria")}>
        <HeatMapModel cells={cells} />
      </div>

      <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1.5" aria-label={t("heat.legend")}>
        {HEAT_LEGEND.map((range, level) => (
          <li key={range} className="tnum flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn("size-3 rounded-sm", SWATCH[level])} aria-hidden />
            {range}
          </li>
        ))}
      </ul>

      {hottest.length > 0 ? (
        <ol className="grid grid-cols-3 gap-2">
          {hottest.map((cell) => (
            <li key={cell.muscle} className="rounded-xl bg-muted/70 p-3 text-center">
              <p className="display-md tnum">{cell.sets}</p>
              <p className="truncate text-xs font-medium text-muted-foreground">{muscleLabel(t, cell.muscle)}</p>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
