"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { MuscleGroup } from "@/lib/db/schema/enums";
import { useT } from "@/lib/i18n/client";
import { muscleLabel } from "@/lib/i18n/labels";

// The anatomy SVG only renders in the browser; loading it lazily keeps it out of the main bundle.
const MuscleMapModel = dynamic(() => import("./muscle-map-model"), {
  ssr: false,
  loading: () => <Skeleton className="h-60 w-full" />,
});

export function MuscleMap({ primary, secondary }: { primary: MuscleGroup; secondary: readonly MuscleGroup[] }) {
  const t = useT();
  return (
    <div className="flex flex-col gap-3">
      <MuscleMapModel primary={primary} secondary={secondary} />
      <p className="text-center text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{muscleLabel(t, primary)}</span>
        {secondary.length > 0 ? t("exercise.alsoWorks", { muscles: secondary.map((m) => muscleLabel(t, m).toLowerCase()).join(", ") }) : ""}
      </p>
    </div>
  );
}
