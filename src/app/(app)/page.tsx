import Link from "next/link";
import { Card } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Stagger, StaggerItem } from "@/components/ui/stagger";
import { formatShortDate, greetingFor, hourInTimeZone, weekdayName } from "@/lib/time";
import { MUSCLE_LABEL } from "@/lib/muscles";
import { ThumbStack } from "@/modules/exercises/components/exercise-thumb";
import { Meter } from "@/components/ui/meter";
import { getLatestWeight } from "@/modules/body/service";
import { getDailyNutrition } from "@/modules/nutrition/service";
import { requireAppUser } from "@/modules/users/app-user";
import { StartWorkoutButton } from "@/modules/workouts/components/start-workout-button";
import { formatVolume } from "@/modules/workouts/domain/format";
import { getWeekProgress, getWorkoutHub, listHistory } from "@/modules/workouts/service";

export default async function HomePage() {
  const user = await requireAppUser();
  const now = new Date();
  const hub = await getWorkoutHub(user.id, now);
  const [week, recent, nutrition, weight] = await Promise.all([
    getWeekProgress(user.id, hub.settings, hub.localDate),
    listHistory(user.id, 3),
    getDailyNutrition(user.id, undefined, now),
    getLatestWeight(user.id),
  ]);

  const tz = hub.settings.timezone;
  const greeting = greetingFor(hourInTimeZone(now, tz));
  const firstName = user.name.split(" ")[0] ?? user.name;
  const weekPercent = week.target === 0 ? 0 : Math.min(100, Math.round((week.completed / week.target) * 100));
  const today = hub.todayDay;

  return (
    <Stagger className="flex flex-col gap-6">
      <StaggerItem>
        <header>
          <p className="text-muted-foreground">
            {greeting}, {firstName}
          </p>
          <h1 className="display-xl mt-1">{weekdayName(now, tz)}</h1>
        </header>
      </StaggerItem>

      <StaggerItem>
        <Card className="hatch overflow-hidden p-6">
          {hub.activeSessionId ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In progress</p>
                  <h2 className="display-lg mt-1">Workout running</h2>
                  <p className="mt-1 text-muted-foreground">Pick up where you left off. Logged sets are saved.</p>
                </div>
                {today ? <ThumbStack images={today.previewImages} muscle={today.muscles[0] ?? "chest"} className="hidden sm:flex" /> : null}
              </div>
              <StartWorkoutButton
                dayId={today?.id ?? ""}
                activeSessionId={hub.activeSessionId}
                label="Resume workout"
                size="lg"
                className="mt-5 w-full"
              />
            </>
          ) : today ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">Today&rsquo;s workout</p>
                  <h2 className="display-lg mt-1">{today.focus}</h2>
                  <p className="mt-1 text-muted-foreground">
                    {today.exerciseCount} exercises · {today.totalSets} sets
                  </p>
                </div>
                <ThumbStack images={today.previewImages.slice(0, 3)} muscle={today.muscles[0] ?? "chest"} className="shrink-0" />
              </div>
              {today.muscles.length > 0 ? (
                <ul className="mt-4 flex flex-wrap gap-2" aria-label="Muscles trained today">
                  {today.muscles.slice(0, 6).map((muscle) => (
                    <li key={muscle} className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                      {MUSCLE_LABEL[muscle]}
                    </li>
                  ))}
                </ul>
              ) : null}
              <StartWorkoutButton dayId={today.id} activeSessionId={null} label="Start workout" size="lg" className="mt-5 w-full" />
              <Link href="/workout" className="mt-3 block text-center text-sm font-medium text-muted-foreground underline-offset-4 hover:underline">
                Training another day? See the whole week
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-muted-foreground">Today</p>
              <h2 className="display-lg mt-1">Rest day</h2>
              <p className="mt-1 text-muted-foreground">Nothing is planned. You can still train.</p>
              <Link
                href="/workout"
                className="mt-5 flex h-14 w-full items-center justify-center rounded-2xl bg-muted text-lg font-semibold transition-transform active:scale-[0.98]"
              >
                Choose a workout
              </Link>
            </>
          )}
        </Card>
      </StaggerItem>

      <StaggerItem>
        <Card className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground">This week</p>
            <p className="display-xl mt-1">
              <AnimatedNumber value={week.completed} />
              <span className="text-muted-foreground"> / {week.target}</span>
            </p>
            <p className="mt-1 text-muted-foreground">workouts completed</p>
          </div>
          <ProgressRing percent={weekPercent} size={72} strokeWidth={8} tone={weekPercent >= 100 ? "success" : "primary"} />
        </Card>
      </StaggerItem>

      <StaggerItem>
        <Link href="/nutrition" className="block">
          <Card className="p-5 transition-transform active:scale-[0.99]">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-lg font-semibold">Nutrition today</h2>
              <span className="text-sm text-muted-foreground">Open</span>
            </div>
            <div className="flex flex-col gap-4">
              <Meter label="Calories" value={nutrition.totals.calories} target={nutrition.targets.calories} unit="kcal" />
              <Meter label="Protein" value={nutrition.totals.protein} target={nutrition.targets.protein} unit="g" barClassName="bg-plate-blue" />
            </div>
          </Card>
        </Link>
      </StaggerItem>

      <StaggerItem>
        <Link href="/body" className="block">
          <Card className="flex items-center justify-between p-5 transition-transform active:scale-[0.99]">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Latest weight</p>
              <p className="display-lg mt-1">{weight ? `${weight.weightKg} kg` : "Log your weight"}</p>
              {weight ? <p className="text-sm text-muted-foreground">{formatShortDate(weight.localDate)}</p> : null}
            </div>
            <span className="text-sm text-muted-foreground">Open</span>
          </Card>
        </Link>
      </StaggerItem>

      <StaggerItem>
        <section aria-labelledby="recent-heading">
          <h2 id="recent-heading" className="mb-3 text-lg font-semibold">
            Recent activity
          </h2>
          {recent.length === 0 ? (
            <Card className="p-6 text-muted-foreground">Your finished workouts will show up here.</Card>
          ) : (
            <ul className="flex flex-col gap-3">
              {recent.map((session) => (
                <li key={session.id}>
                  <Link href={`/workout/${session.id}`} className="block">
                    <Card className="flex items-center justify-between p-4 transition-transform active:scale-[0.99]">
                      <div>
                        <p className="font-semibold">{session.focus}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatShortDate(session.localDate)} · {session.completedSets} sets
                        </p>
                      </div>
                      <p className="tnum text-right font-medium">{formatVolume(session.totalVolumeKg)}</p>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </StaggerItem>
    </Stagger>
  );
}
