"use client";

import { Canvas } from "@react-three/fiber";
import { useTheme } from "next-themes";
import { Suspense, use, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n/client";
import { muscleLabel } from "@/lib/i18n/labels";
import type { MuscleGroup } from "@/lib/db/schema/enums";
import { cn } from "@/lib/utils";
import type { HeatCell } from "../../domain/heat";
import HeatMapModel from "../heat-map-model";
import { Boundary } from "./boundary";
import { MODEL_CREDIT, MODEL_URL } from "./config";
import { modelExists } from "./model-check";
import { Controls, GlbBody, HeatDriver, ProceduralBody, useMaterials, type Rig } from "./scene-parts";

interface SceneProps {
  cells: readonly HeatCell[];
  selected: MuscleGroup | null;
  onSelect: (muscle: MuscleGroup | null) => void;
  rig: Rig;
  dark: boolean;
}

function Scene({ cells, selected, onSelect, rig, dark, useModel }: SceneProps & { useModel: boolean }) {
  const baseColor = dark ? "#2b3470" : "#c9cfe6";
  const materials = useMaterials(baseColor, dark ? "#222a5c" : "#b3bad6");

  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.05, 3], fov: 38 }}
      gl={{ antialias: true, alpha: true }}
      onPointerMissed={() => onSelect(null)}
      style={{ touchAction: "none" }}
    >
      <hemisphereLight args={["#ffffff", dark ? "#2a3170" : "#9aa3d6", 0.9]} />
      <directionalLight position={[2, 3, 3]} intensity={1.4} />
      <directionalLight position={[-2, 2, -3]} intensity={0.9} />
      <Suspense fallback={null}>{useModel ? <GlbBody materials={materials} onSelect={onSelect} /> : <ProceduralBody materials={materials} onSelect={onSelect} />}</Suspense>
      <HeatDriver cells={cells} selected={selected} materials={materials} baseColor={baseColor} />
      <Controls rig={rig} />
    </Canvas>
  );
}

/** Looks for a real model first (one cheap request); without one, the stylised body is drawn. */
function ModelGate(props: SceneProps) {
  const hasModel = use(modelExists(MODEL_URL));
  return <Scene {...props} useModel={hasModel} />;
}

/** The body in 3D, coloured by weekly volume. Drag to rotate, pinch to zoom, tap a muscle to read its sets. */
export default function Body3DView({ cells }: { cells: readonly HeatCell[] }) {
  const t = useT();
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const [selected, setSelected] = useState<MuscleGroup | null>(null);
  const [rig, setRig] = useState<Rig>({ side: "front", n: 0 });
  const cell = selected ? cells.find((c) => c.muscle === selected) : undefined;

  const fallback = (
    <div className="flex flex-col gap-3">
      <p className="text-center text-sm text-muted-foreground">{t("heat.error3d")}</p>
      <HeatMapModel cells={cells} />
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      <Boundary fallback={fallback}>
        <div className="relative h-[340px] w-full overflow-hidden rounded-2xl border border-border bg-muted/30">
          <Suspense fallback={<Skeleton className="size-full rounded-none" />}>
            <ModelGate cells={cells} selected={selected} onSelect={setSelected} rig={rig} dark={dark} />
          </Suspense>
          <div className="absolute right-2 top-2 flex gap-1 rounded-xl bg-background/80 p-1 backdrop-blur">
            {(["front", "back"] as const).map((side) => (
              <button
                key={side}
                type="button"
                onClick={() => setRig((current) => ({ side, n: current.n + 1 }))}
                className={cn("h-9 rounded-lg px-3 text-sm font-semibold", rig.side === side ? "bg-card text-foreground shadow-card" : "text-muted-foreground")}
              >
                {t(side === "front" ? "heat.front" : "heat.back")}
              </button>
            ))}
          </div>
        </div>
      </Boundary>

      <div className="min-h-14 rounded-xl bg-muted/70 px-4 py-3 text-center" aria-live="polite">
        {cell ? (
          <>
            <p className="font-semibold">{muscleLabel(t, cell.muscle)}</p>
            <p className="tnum text-sm text-muted-foreground">{cell.sets > 0 ? t("heat.setsThisWeek", { count: cell.sets }) : t("heat.noSets")}</p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{t("heat.hint3d")}</p>
        )}
      </div>
      {MODEL_CREDIT ? <p className="text-center text-xs text-muted-foreground">{t("heat.credit", { credit: MODEL_CREDIT })}</p> : null}
    </div>
  );
}
