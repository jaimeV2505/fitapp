import { AnimatedNumber } from "@/components/ui/animated-number";
import { Card } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { getI18n } from "@/lib/i18n/server";
import { getWeekProgress } from "@/modules/workouts/service";

export async function WeekCard({ userId }: { userId: string }) {
  const { t } = await getI18n();
  const week = await getWeekProgress(userId);
  const percent = week.target === 0 ? 0 : Math.min(100, Math.round((week.completed / week.target) * 100));

  return (
    <Card className="flex items-center justify-between p-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{t("home.thisWeek")}</p>
        <p className="display-lg mt-1">
          <AnimatedNumber value={week.completed} />
          <span className="text-muted-foreground"> / {week.target}</span>
        </p>
        <p className="mt-1 text-muted-foreground">{t("home.workoutsCompleted")}</p>
      </div>
      <ProgressRing percent={percent} size={72} strokeWidth={8} tone={percent >= 100 ? "success" : "primary"} />
    </Card>
  );
}
