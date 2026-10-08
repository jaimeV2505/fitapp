import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PlanEditor } from "@/modules/workouts/components/plan-editor";
import { getWeekPlan } from "@/modules/workouts/service";
import { requireAppUser } from "@/modules/users/app-user";

export const metadata = { title: "Edit routine" };

export default async function EditRoutinePage() {
  const user = await requireAppUser();
  const plan = await getWeekPlan(user.id);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/workout" className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground">
          <ChevronLeft className="size-4" /> Workout
        </Link>
        <h1 className="display-xl">Edit routine</h1>
        <p className="mt-2 text-muted-foreground">
          Add, replace, reorder or remove exercises for each day. Changes apply to future workouts; finished ones are never rewritten.
        </p>
      </header>
      {plan.days.length === 0 ? (
        <Card className="p-6 text-muted-foreground">No routine yet.</Card>
      ) : (
        <PlanEditor days={plan.days} todayDayId={plan.todayDayId} />
      )}
    </div>
  );
}
