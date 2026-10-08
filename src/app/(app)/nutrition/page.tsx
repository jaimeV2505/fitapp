import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { z } from "zod";
import { Stagger, StaggerItem } from "@/components/ui/stagger";
import { INTL_LOCALE } from "@/lib/i18n/config";
import { titleOf } from "@/lib/i18n/metadata";
import { getI18n } from "@/lib/i18n/server";
import { formatLongDate } from "@/lib/time";
import { listFoods } from "@/modules/foods/service";
import { MacroDashboard } from "@/modules/nutrition/components/macro-dashboard";
import { MealActions } from "@/modules/nutrition/components/meal-actions";
import { MealList } from "@/modules/nutrition/components/meal-list";
import { buildRecentMeals } from "@/modules/nutrition/domain/recent-meals";
import { getDailyNutrition, getRecentMealSources, getTemplates } from "@/modules/nutrition/service";
import { requireAppUser } from "@/modules/users/app-user";

export const generateMetadata = titleOf("nutrition.title");

// The food photo estimate (a server action on this page) waits for the AI model: allow up to a minute on Vercel.
export const maxDuration = 60;

const dateParam = z.iso.date();

export default async function NutritionPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const user = await requireAppUser();
  const { t, locale } = await getI18n();
  const { date } = await searchParams;
  const parsed = dateParam.safeParse(date);

  const [day, templates, foods, recentSources] = await Promise.all([
    getDailyNutrition(user.id, parsed.success ? parsed.data : undefined),
    getTemplates(user.id),
    listFoods(user.id),
    getRecentMealSources(user.id),
  ]);
  const recent = buildRecentMeals(recentSources, new Set(foods.map((food) => food.id)));

  const navLink = "flex size-11 items-center justify-center rounded-full border border-border bg-card transition-transform active:scale-95";

  return (
    <Stagger className="flex flex-col gap-6">
      <StaggerItem>
        <header className="flex items-end justify-between gap-4">
          <div>
            <p className="text-muted-foreground">{day.isToday ? t("common.today") : t("nutrition.dailyLog")}</p>
            <h1 className="display-xl mt-1">{t("nutrition.title")}</h1>
          </div>
          <nav aria-label={t("nutrition.changeDay")} className="flex items-center gap-2">
            <Link href={`/nutrition?date=${day.previousDate}`} aria-label={t("nutrition.previousDay")} className={navLink}>
              <ChevronLeft className="size-5" />
            </Link>
            <Link href={`/nutrition?date=${day.nextDate}`} aria-label={t("nutrition.nextDay")} className={navLink}>
              <ChevronRight className="size-5" />
            </Link>
          </nav>
        </header>
        <p className="mt-2 font-medium">{formatLongDate(day.date, INTL_LOCALE[locale])}</p>
        {!day.isToday ? (
          <Link href="/nutrition" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
            {t("nutrition.backToToday")}
          </Link>
        ) : null}
      </StaggerItem>

      <StaggerItem>
        <MacroDashboard totals={day.totals} targets={day.targets} />
      </StaggerItem>

      <StaggerItem>
        <MealActions templates={templates} recent={recent} foods={foods} date={day.date} isToday={day.isToday} />
      </StaggerItem>

      <StaggerItem>
        <section aria-labelledby="meals-heading">
          <h2 id="meals-heading" className="mb-3 text-lg font-semibold">
            {t("nutrition.meals")}
          </h2>
          <MealList meals={day.meals} />
        </section>
      </StaggerItem>

      <StaggerItem>
        <Link href="/nutrition/foods" className="block text-center font-medium text-muted-foreground underline-offset-4 hover:underline">
          {t("nutrition.manageFoods")}
        </Link>
      </StaggerItem>
    </Stagger>
  );
}
