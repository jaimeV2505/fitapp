"use client";

import Model from "react-body-highlighter";
import { useTheme } from "next-themes";
import type { MuscleGroup } from "@/lib/db/schema/enums";
import { toBodyMuscles } from "@/lib/muscles";

interface MuscleMapModelProps {
  primary: MuscleGroup;
  secondary: readonly MuscleGroup[];
}

type ModelData = React.ComponentProps<typeof Model>["data"];

/** Front and back anatomy with the trained muscles highlighted (strong = primary, soft = secondary). */
export default function MuscleMapModel({ primary, secondary }: MuscleMapModelProps) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  const primaryIds = [...toBodyMuscles(primary)];
  const secondaryIds = secondary.flatMap((group) => [...toBodyMuscles(group)]).filter((id) => !primaryIds.includes(id));

  // The library colours a muscle by how many entries contain it: primary muscles are listed twice.
  const data = [
    { name: "all", muscles: [...primaryIds, ...secondaryIds] },
    { name: "primary", muscles: primaryIds },
  ] as unknown as ModelData;

  const colors = dark ? ["#8a7424", "#f4c531"] : ["#9aa3d6", "#1b2154"];
  const bodyColor = dark ? "#262e66" : "#dfe3ef";

  return (
    <div className="flex items-start justify-center gap-4">
      {(["anterior", "posterior"] as const).map((view) => (
        <Model
          key={view}
          type={view}
          data={data}
          bodyColor={bodyColor}
          highlightedColors={colors}
          style={{ width: "9rem", maxWidth: "42vw" }}
        />
      ))}
    </div>
  );
}
