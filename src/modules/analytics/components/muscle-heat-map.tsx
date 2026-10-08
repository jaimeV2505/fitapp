"use client";

import dynamic from "next/dynamic";
import { useState, useSyncExternalStore } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n/client";
import { muscleLabel } from "@/lib/i18n/labels";
import { subscribeNever, supportsWebGL } from "@/lib/webgl";
import { cn } from "@/lib/utils";
import { HEAT_LEGEND, buildHeatMap } from "../domain/heat";
import type { MuscleSets } from "../types";

const HeatMapModel = dynamic(() => import("./heat-map-model"), { ssr: false, loading: () => <Skeleton className="h-72 w-full" /> });
// The 3D engine is large: it is downloaded only when someone chooses the 3D view.
const Body3DView = dynamic(() => import("./body3d/body-3d-view"), { ssr: false, loading: () => <Skeleton className="h-[340px] w-full" /> });

const SWATCH = ["bg-muted", "bg-[#4c7bea]", "bg-[#2fb56f]", "bg-[#f4c531]", "bg-[#f08a24]", "bg-[#e5483d]"] as const;

/** The body, heated by this week's completed sets per muscle: flat (2D) or turnable (3D), with the hottest muscles under it. */
export function MuscleHeatMap({ rows }: { rows: readonly MuscleSets[] }) {
  const t = useT();
  const [mode, setMode] = useState<"2d" | "3d">("2d");
  // The server cannot know: it renders "no 3D" and the browser corrects it on arrival.
  const canShow3d = useSyncExternalStore(subscribeNever, supportsWebGL, () => false);
  const cells = buildHeatMap(rows);
  const hottest = [...cells].filter((c) => c.sets > 0).sort((a, b) => b.sets - a.sets).slice(0, 3);
  const view = mode === "3d" && canShow3d ? "3d" : "2d";

  return (
    <div className="flex flex-col gap-4">
      {canShow3d ? (
        <div role="radiogroup" aria-label={t("heat.viewLabel")} className="mx-auto grid w-40 grid-cols-2 gap-1 rounded-xl bg-muted p-1">
          {(["2d", "3d"] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={view === option}
              onClick={() => setMode(option)}
              className={cn("h-9 rounded-lg text-sm font-semibold", view === option ? "bg-card text-foreground shadow-card" : "text-muted-foreground")}
            >
              {t(option === "2d" ? "heat.view2d" : "heat.view3d")}
            </button>
          ))}
        </div>
      ) : null}

      {view === "3d" ? (
        <Body3DView cells={cells} />
      ) : (
        <div role="img" aria-label={t("heat.aria")}>
          <HeatMapModel cells={cells} />
        </div>
      )}

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
      ) : (
        <p className="text-center text-sm text-muted-foreground">{t("heat.empty")}</p>
      )}
    </div>
  );
}
