import Link from "next/link";
import { Card } from "@/components/ui/card";
import { requireAppUser } from "@/modules/users/app-user";
import { WeekPlanner } from "@/modules/workouts/components/week-planner";
import { getWeekPlan } from "@/modules/workouts/service";

export const metadata = { title: "Workout" };

export default async function WorkoutHubPage() {
  const user = await requireAppUser();
  const plan = await getWeekPlan(user.id);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-muted-foreground">Your routine</p>
        <h1 className="display-xl mt-1">Pick your day</h1>
      </header>

      {/* A running workout is offered as "Resume" (no redirect during render: it also trips a dev-only Next.js bug). */}
      {plan.activeSessionId ? (
        <Card className="border-primary/50 p-4">
          <p className="font-semibold">You have a workout in progress</p>
          <p className="text-sm text-muted-foreground">Resume it below. Your logged sets are saved.</p>
        </Card>
      ) : null}

      {plan.days.length === 0 ? (
        <Card className="p-6 text-muted-foreground">No routine yet. It is created the first time you sign in.</Card>
      ) : (
        <WeekPlanner days={plan.days} todayDayId={plan.todayDayId} activeSessionId={plan.activeSessionId} />
      )}

      <div className="flex flex-col items-center gap-2">
        <Link href="/workout/plan" className="font-semibold underline-offset-4 hover:underline">
          Edit routine
        </Link>
        <Link href="/library" className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline">
          Browse the exercise library
        </Link>
      </div>
    </div>
  );
}
