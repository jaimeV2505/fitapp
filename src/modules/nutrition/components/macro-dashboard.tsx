"use client";

import { useState } from "react";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Meter } from "@/components/ui/meter";
import { ProgressRing } from "@/components/ui/progress-ring";
import { percentOf, type Macros } from "../domain/macros";
import type { NutritionTargets } from "../types";
import { TargetsSheet } from "./targets-sheet";

interface MacroDashboardProps {
  totals: Macros;
  targets: NutritionTargets;
}

export function MacroDashboard({ totals, targets }: MacroDashboardProps) {
  const [editing, setEditing] = useState(false);
  const percent = percentOf(totals.calories, targets.calories);
  const hasAnyTarget = Object.values(targets).some((value) => value !== null);

  return (
    <Card className="hatch p-5">
      <div className="flex items-center gap-5">
        <ProgressRing percent={Math.min(percent ?? 0, 100)} size={132} strokeWidth={12} tone={percent !== null && percent >= 100 ? "success" : "primary"}>
          <div className="text-center leading-none">
            <AnimatedNumber value={Math.round(totals.calories)} className="font-display text-4xl font-bold" />
            <p className="mt-1 text-xs font-medium text-muted-foreground">kcal</p>
          </div>
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">Calories</p>
          <p className="display-lg mt-1">
            {targets.calories ? (
              <>
                <AnimatedNumber value={Math.round(totals.calories)} /> <span className="text-muted-foreground">/ {targets.calories}</span>
              </>
            ) : (
              <AnimatedNumber value={Math.round(totals.calories)} />
            )}
          </p>
          {targets.calories && percent !== null ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {percent >= 100 ? `${Math.round(totals.calories - targets.calories)} kcal over target` : `${Math.round(targets.calories - totals.calories)} kcal left`}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <Meter label="Protein" value={totals.protein} target={targets.protein} unit="g" barClassName="bg-plate-blue" />
        <Meter label="Carbs" value={totals.carbs} target={targets.carbs} unit="g" barClassName="bg-plate-yellow" />
        <Meter label="Fat" value={totals.fat} target={targets.fat} unit="g" barClassName="bg-plate-red" />
      </div>

      <Button variant="secondary" size="sm" className="mt-5" onClick={() => setEditing(true)}>
        {hasAnyTarget ? "Edit targets" : "Set daily targets"}
      </Button>
      {editing ? <TargetsSheet open={editing} onOpenChange={setEditing} targets={targets} /> : null}
    </Card>
  );
}
