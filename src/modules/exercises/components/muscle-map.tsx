"use client";

import dynamic from "next/dynamic";
import type { MuscleGroup } from "@/lib/db/schema/enums";
import { MUSCLE_LABEL } from "@/lib/muscles";
import { Skeleton } from "@/components/ui/skeleton";

// The anatomy SVG only renders in the browser; loading it lazily keeps it out of the main bundle.
const MuscleMapModel = dynamic(() => import("./muscle-map-model"), {
  ssr: false,
  loading: () => <Skeleton className="h-60 w-full" />,
});

export function MuscleMap({ primary, secondary }: { primary: MuscleGroup; secondary: readonly MuscleGroup[] }) {
  return (
    <div className="flex flex-col gap-3">
      <MuscleMapModel primary={primary} secondary={secondary} />
      <p className="text-center text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{MUSCLE_LABEL[primary]}</span>
        {secondary.length > 0 ? ` · also ${secondary.map((m) => MUSCLE_LABEL[m].toLowerCase()).join(", ")}` : ""}
      </p>
    </div>
  );
}
