import Link from "next/link";
import { Card } from "@/components/ui/card";
import { titleOf } from "@/lib/i18n/metadata";
import { getT } from "@/lib/i18n/server";
import { requireAppUser } from "@/modules/users/app-user";
import { WeekPlanner } from "@/modules/workouts/components/week-planner";
import { getWeekPlan } from "@/modules/workouts/service";

export const generateMetadata = titleOf("nav.workout");

export default async function WorkoutHubPage() {
  const user = await requireAppUser();
  const [t, plan] = await Promise.all([getT(), getWeekPlan(user.id)]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-muted-foreground">{t("planner.yourRoutine")}</p>
        <h1 className="display-xl mt-1">{t("planner.pickDay")}</h1>
      </header>

      {/* A running workout is offered as "Resume" (no redirect during render: it also trips a dev-only Next.js bug). */}
      {plan.activeSessionId ? (
        <Card className="border-primary/50 p-4">
          <p className="font-semibold">{t("planner.inProgressTitle")}</p>
          <p className="text-sm text-muted-foreground">{t("planner.inProgressText")}</p>
        </Card>
      ) : null}

      {plan.days.length === 0 ? (
        <Card className="p-6 text-muted-foreground">{t("planner.noRoutine")}</Card>
      ) : (
        <WeekPlanner days={plan.days} todayDayId={plan.todayDayId} activeSessionId={plan.activeSessionId} />
      )}

      <div className="flex flex-col items-center gap-2">
        <Link href="/workout/plan" className="font-semibold underline-offset-4 hover:underline">
          {t("planner.editRoutine")}
        </Link>
        <Link href="/library" className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline">
          {t("planner.browseLibrary")}
        </Link>
      </div>
    </div>
  );
}
