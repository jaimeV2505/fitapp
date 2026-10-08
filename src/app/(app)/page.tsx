import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Stagger, StaggerItem } from "@/components/ui/stagger";
import { INTL_LOCALE } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { greetingFor, hourInTimeZone, weekdayName } from "@/lib/time";
import { NutritionCard } from "@/modules/home/components/nutrition-card";
import { RecentList } from "@/modules/home/components/recent-list";
import { TodayCard } from "@/modules/home/components/today-card";
import { WeekCard } from "@/modules/home/components/week-card";
import { WeightCard } from "@/modules/home/components/weight-card";
import { getUserSettings } from "@/modules/settings/repository";
import { requireAppUser } from "@/modules/users/app-user";

/**
 * The page shell (greeting and weekday) renders immediately; every card fetches its own data inside a Suspense
 * boundary and streams in as soon as it is ready, instead of the whole page waiting for the slowest query.
 */
export default async function HomePage() {
  const user = await requireAppUser();
  const { t, locale } = await getI18n();
  const settings = await getUserSettings(user.id); // already cached by requireAppUser

  const now = new Date();
  const greeting = t(`home.greeting.${greetingFor(hourInTimeZone(now, settings.timezone))}`);
  const firstName = user.name.split(" ")[0] ?? user.name;

  return (
    <Stagger className="flex flex-col gap-6">
      <StaggerItem>
        <header>
          <p className="text-muted-foreground">
            {greeting}, {firstName}
          </p>
          <h1 className="display-xl mt-1">{weekdayName(now, settings.timezone, INTL_LOCALE[locale])}</h1>
        </header>
      </StaggerItem>

      <StaggerItem>
        <Suspense fallback={<Skeleton className="h-56 w-full rounded-card" />}>
          <TodayCard userId={user.id} />
        </Suspense>
      </StaggerItem>

      <StaggerItem>
        <Suspense fallback={<Skeleton className="h-32 w-full rounded-card" />}>
          <WeekCard userId={user.id} />
        </Suspense>
      </StaggerItem>

      <StaggerItem>
        <Suspense fallback={<Skeleton className="h-36 w-full rounded-card" />}>
          <NutritionCard userId={user.id} />
        </Suspense>
      </StaggerItem>

      <StaggerItem>
        <Suspense fallback={<Skeleton className="h-24 w-full rounded-card" />}>
          <WeightCard userId={user.id} />
        </Suspense>
      </StaggerItem>

      <StaggerItem>
        <section aria-labelledby="recent-heading">
          <h2 id="recent-heading" className="mb-3 text-lg font-semibold">
            {t("home.recentActivity")}
          </h2>
          <Suspense fallback={<Skeleton className="h-20 w-full rounded-card" />}>
            <RecentList userId={user.id} />
          </Suspense>
        </section>
      </StaggerItem>
    </Stagger>
  );
}
