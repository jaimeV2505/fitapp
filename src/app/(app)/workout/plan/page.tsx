import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { titleOf } from "@/lib/i18n/metadata";
import { getT } from "@/lib/i18n/server";
import { PlanEditor } from "@/modules/workouts/components/plan-editor";
import { getWeekPlan } from "@/modules/workouts/service";
import { requireAppUser } from "@/modules/users/app-user";

export const generateMetadata = titleOf("planEditor.title");

export default async function EditRoutinePage() {
  const user = await requireAppUser();
  const [t, plan] = await Promise.all([getT(), getWeekPlan(user.id)]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/workout" className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground">
          <ChevronLeft className="size-4" /> {t("planEditor.back")}
        </Link>
        <h1 className="display-xl">{t("planEditor.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("planEditor.intro")}</p>
      </header>
      {plan.days.length === 0 ? (
        <Card className="p-6 text-muted-foreground">{t("planEditor.noRoutine")}</Card>
      ) : (
        <PlanEditor days={plan.days} todayDayId={plan.todayDayId} />
      )}
    </div>
  );
}
