import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { LazyWeightChart } from "@/components/lazy-charts";
import { Card } from "@/components/ui/card";
import { Stagger, StaggerItem } from "@/components/ui/stagger";
import { INTL_LOCALE } from "@/lib/i18n/config";
import { titleOf } from "@/lib/i18n/metadata";
import { getI18n } from "@/lib/i18n/server";
import type { MessageKey } from "@/lib/i18n/types";
import { cn } from "@/lib/utils";
import { LogMeasurementButton } from "@/modules/body/components/log-measurement-sheet";
import { MeasurementHistory } from "@/modules/body/components/measurement-history";
import { getBodyOverview } from "@/modules/body/service";
import { rangeSchema } from "@/modules/body/validators";
import type { MeasureField } from "@/modules/body/types";
import { requireAppUser } from "@/modules/users/app-user";

export const generateMetadata = titleOf("body.title");

const RANGES = [7, 30, 90] as const;
const MEASURE_LABEL: Record<MeasureField, { label: MessageKey; unit: string }> = {
  bodyFatPercent: { label: "body.bodyFat", unit: "%" },
  waistCm: { label: "body.waist", unit: "cm" },
  chestCm: { label: "body.chest", unit: "cm" },
  armCm: { label: "body.arm", unit: "cm" },
  legCm: { label: "body.leg", unit: "cm" },
};

const signed = (value: number): string => `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value)}`;

export default async function BodyPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const user = await requireAppUser();
  const { t, locale } = await getI18n();
  const { range } = rangeSchema.catch({ range: "30" }).parse(await searchParams);
  const rangeDays = Number(range);
  const overview = await getBodyOverview(user.id, rangeDays);
  const { change } = overview;

  return (
    <Stagger className="flex flex-col gap-6">
      <StaggerItem>
        <header>
          <Link href="/progress" className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground">
            <ChevronLeft className="size-4" /> {t("body.progress")}
          </Link>
          <h1 className="display-xl">{t("body.title")}</h1>
        </header>
      </StaggerItem>

      <StaggerItem>
        <LogMeasurementButton lastWeightKg={overview.latestWeightKg} />
      </StaggerItem>

      <StaggerItem>
        <Card className="p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t("body.latestWeight")}</p>
              <p className="display-lg mt-1">
                {overview.latestWeightKg === null ? "–" : <AnimatedNumber value={overview.latestWeightKg} decimals={1} suffix=" kg" />}
              </p>
            </div>
            {change ? (
              <div className="text-right">
                <p className="text-sm font-medium text-muted-foreground">{t("body.trend", { days: rangeDays })}</p>
                <p className="display-md tnum mt-1">{signed(change.deltaKg)} kg</p>
              </div>
            ) : null}
          </div>

          <div role="radiogroup" aria-label={t("body.range")} className="mt-4 grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
            {RANGES.map((value) => (
              <Link
                key={value}
                href={`/body?range=${value}`}
                role="radio"
                aria-checked={rangeDays === value}
                className={cn(
                  "flex h-10 items-center justify-center rounded-lg text-sm font-semibold transition-colors",
                  rangeDays === value ? "bg-card text-foreground" : "text-muted-foreground",
                )}
              >
                {t("body.days", { days: value })}
              </Link>
            ))}
          </div>
          <div className="mt-4">
            <LazyWeightChart points={overview.series} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{t("body.chartNote")}</p>
        </Card>
      </StaggerItem>

      <StaggerItem>
        <Card className="p-5">
          <h2 className="text-lg font-semibold">{t("body.intakeTitle")}</h2>
          {overview.averageCalories !== null && overview.loggedDays > 0 ? (
            <p className="mt-2">
              {t("body.intake", {
                kcal: overview.averageCalories.toLocaleString(INTL_LOCALE[locale]),
                days: overview.loggedDays,
                trend: change ? t("body.intakeTrend", { delta: signed(change.deltaKg) }) : t("body.intakeNoTrend"),
              })}
            </p>
          ) : (
            <p className="mt-2 text-muted-foreground">{t("body.intakeEmpty")}</p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">{t("body.intakeNote")}</p>
        </Card>
      </StaggerItem>

      {overview.measures.length > 0 ? (
        <StaggerItem>
          <section aria-labelledby="measures-heading">
            <h2 id="measures-heading" className="mb-3 text-lg font-semibold">
              {t("body.measurements")}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {overview.measures.map((m) => (
                <Card key={m.field} className="p-4">
                  <p className="text-xs font-medium text-muted-foreground">{t(MEASURE_LABEL[m.field].label)}</p>
                  <p className="display-md tnum mt-1">
                    {m.latest} {MEASURE_LABEL[m.field].unit}
                  </p>
                  {m.delta !== null ? <p className="tnum text-xs text-muted-foreground">{t("body.sinceLast", { delta: signed(m.delta) })}</p> : null}
                </Card>
              ))}
            </div>
          </section>
        </StaggerItem>
      ) : null}

      <StaggerItem>
        <section aria-labelledby="entries-heading">
          <h2 id="entries-heading" className="mb-3 text-lg font-semibold">
            {t("body.entries")}
          </h2>
          <MeasurementHistory items={overview.history} />
        </section>
      </StaggerItem>
    </Stagger>
  );
}
