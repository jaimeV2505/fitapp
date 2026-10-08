import Link from "next/link";
import { Card } from "@/components/ui/card";
import { getI18n } from "@/lib/i18n/server";
import { muscleLabel } from "@/lib/i18n/labels";
import { ThumbStack } from "@/modules/exercises/components/exercise-thumb";
import { StartWorkoutButton } from "@/modules/workouts/components/start-workout-button";
import { getWorkoutHub } from "@/modules/workouts/service";

/** Today's workout (or the running one). Streams in on its own so the page shell appears immediately. */
export async function TodayCard({ userId }: { userId: string }) {
  const { t, name } = await getI18n();
  const hub = await getWorkoutHub(userId);
  const today = hub.todayDay;

  return (
    <Card className="hatch overflow-hidden p-6">
      {hub.activeSessionId ? (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t("home.inProgress")}</p>
              <h2 className="display-lg mt-1">{t("home.workoutRunning")}</h2>
              <p className="mt-1 text-muted-foreground">{t("home.resumeText")}</p>
            </div>
            {today ? <ThumbStack images={today.previewImages} muscle={today.muscles[0] ?? "chest"} className="hidden sm:flex" /> : null}
          </div>
          <StartWorkoutButton dayId={today?.id ?? ""} activeSessionId={hub.activeSessionId} label={t("home.resumeWorkout")} size="lg" className="mt-5 w-full" />
        </>
      ) : today ? (
        <>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">{t("home.todaysWorkout")}</p>
              <h2 className="display-lg mt-1">{name(today.focus)}</h2>
              <p className="mt-1 text-muted-foreground">{t("home.exercisesSets", { exercises: today.exerciseCount, sets: today.totalSets })}</p>
            </div>
            <ThumbStack images={today.previewImages.slice(0, 3)} muscle={today.muscles[0] ?? "chest"} className="shrink-0" />
          </div>
          {today.muscles.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label={t("home.musclesToday")}>
              {today.muscles.slice(0, 6).map((muscle) => (
                <li key={muscle} className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                  {muscleLabel(t, muscle)}
                </li>
              ))}
            </ul>
          ) : null}
          <StartWorkoutButton dayId={today.id} activeSessionId={null} label={t("home.startWorkout")} size="lg" className="mt-5 w-full" />
          <Link href="/workout" className="mt-3 block text-center text-sm font-medium text-muted-foreground underline-offset-4 hover:underline">
            {t("home.changeDay")}
          </Link>
        </>
      ) : (
        <>
          <p className="text-sm font-medium text-muted-foreground">{t("common.today")}</p>
          <h2 className="display-lg mt-1">{t("home.restDay")}</h2>
          <p className="mt-1 text-muted-foreground">{t("home.restText")}</p>
          <Link
            href="/workout"
            className="mt-5 flex h-14 w-full items-center justify-center rounded-2xl bg-muted text-lg font-semibold transition-transform active:scale-[0.98]"
          >
            {t("home.chooseWorkout")}
          </Link>
        </>
      )}
    </Card>
  );
}
