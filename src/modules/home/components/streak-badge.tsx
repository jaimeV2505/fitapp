"use client";

import { GoldPlate } from "@/components/ui/gold-plate";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import type { Streak } from "../domain/consistency";

/** The weekly streak as a small gold plate carrying the number of weeks, with the best run next to it. */
export function StreakBadge({ streak, className }: { streak: Streak; className?: string }) {
  const t = useT();
  if (streak.current === 0) return <p className={cn("text-sm text-muted-foreground", className)}>{t("streak.none")}</p>;
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <GoldPlate size={38} label={String(streak.current)} shine={false} />
      <div>
        <p className="font-semibold">{t("streak.label", { count: streak.current })}</p>
        {streak.best > streak.current ? <p className="text-sm text-muted-foreground">{t("streak.best", { count: streak.best })}</p> : null}
      </div>
    </div>
  );
}
