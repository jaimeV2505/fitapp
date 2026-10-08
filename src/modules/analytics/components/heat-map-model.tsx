"use client";

import Model from "react-body-highlighter";
import { useTheme } from "next-themes";
import { toBodyMuscles } from "@/lib/muscles";
import type { HeatCell } from "../domain/heat";

type ModelData = React.ComponentProps<typeof Model>["data"];

/** Cool to hot: the same order as the colour of the plates (blue, green, yellow) continuing into orange and red. */
export const HEAT_COLORS = ["#4c7bea", "#2fb56f", "#f4c531", "#f08a24", "#e5483d"] as const;

/**
 * Front and back of the body, each muscle coloured by its weekly volume.
 * The library colours a muscle by how many entries contain it, so level N appears in N entries.
 */
export default function HeatMapModel({ cells }: { cells: readonly HeatCell[] }) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  const data = [1, 2, 3, 4, 5].map((level) => ({
    name: `level-${level}`,
    muscles: cells.filter((cell) => cell.level >= level).flatMap((cell) => [...toBodyMuscles(cell.muscle)]),
  })) as unknown as ModelData;

  return (
    <div className="flex items-start justify-center gap-4">
      {(["anterior", "posterior"] as const).map((view) => (
        <Model
          key={view}
          type={view}
          data={data}
          bodyColor={dark ? "#262e66" : "#dfe3ef"}
          highlightedColors={[...HEAT_COLORS]}
          style={{ width: "9.5rem", maxWidth: "42vw" }}
        />
      ))}
    </div>
  );
}
