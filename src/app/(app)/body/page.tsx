import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Card } from "@/components/ui/card";
import { Stagger, StaggerItem } from "@/components/ui/stagger";
import { cn } from "@/lib/utils";
import { LogMeasurementButton } from "@/modules/body/components/log-measurement-sheet";
import { MeasurementHistory } from "@/modules/body/components/measurement-history";
import { WeightChart } from "@/modules/body/components/weight-chart";
import { getBodyOverview } from "@/modules/body/service";
import { rangeSchema } from "@/modules/body/validators";
import type { MeasureField } from "@/modules/body/types";
import { requireAppUser } from "@/modules/users/app-user";

export const metadata = { title: "Body" };

const RANGES = [7, 30, 90] as const;
const MEASURE_LABEL: Record<MeasureField, { label: string; unit: string }> = {
  bodyFatPercent: { label: "Body fat", unit: "%" },
  waistCm: { label: "Waist", unit: "cm" },
  chestCm: { label: "Chest", unit: "cm" },
  armCm: { label: "Arm", unit: "cm" },
  legCm: { label: "Leg", unit: "cm" },
};

const signed = (value: number): string => `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value)}`;

export default async function BodyPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const user = await requireAppUser();
  const { range } = rangeSchema.catch({ range: "30" }).parse(await searchParams);
  const rangeDays = Number(range);
  const overview = await getBodyOverview(user.id, rangeDays);
  const { change } = overview;

  return (
    <Stagger className="flex flex-col gap-6">
      <StaggerItem>
        <header>
          <Link href="/progress" className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground">
            <ChevronLeft className="size-4" /> Progress
          </Link>
          <h1 className="display-xl">Body</h1>
        </header>
      </StaggerItem>

      <StaggerItem>
        <LogMeasurementButton lastWeightKg={overview.latestWeightKg} />
      </StaggerItem>

      <StaggerItem>
        <Card className="p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Latest weight</p>
              <p className="display-lg mt-1">
                {overview.latestWeightKg === null ? "–" : <AnimatedNumber value={overview.latestWeightKg} decimals={1} suffix=" kg" />}
              </p>
            </div>
            {change ? (
              <div className="text-right">
                <p className="text-sm font-medium text-muted-foreground">{rangeDays}-day trend</p>
                <p className="display-md tnum mt-1">{signed(change.deltaKg)} kg</p>
              </div>
            ) : null}
          </div>

          <div role="radiogroup" aria-label="Range" className="mt-4 grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
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
                {value} days
              </Link>
            ))}
          </div>
          <div className="mt-4">
            <WeightChart points={overview.series} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Grey dots are weigh-ins. The line is the 7-day moving average, which smooths daily water and food swings.</p>
        </Card>
      </StaggerItem>

      <StaggerItem>
        <Card className="p-5">
          <h2 className="text-lg font-semibold">Intake and weight</h2>
          {overview.averageCalories !== null && overview.loggedDays > 0 ? (
            <p className="mt-2">
              You averaged <span className="tnum font-semibold">{overview.averageCalories.toLocaleString("en-US")} kcal</span> on the {overview.loggedDays}{" "}
              {overview.loggedDays === 1 ? "day" : "days"} you logged meals in this period
              {change ? (
                <>
                  , while your smoothed weight changed by <span className="tnum font-semibold">{signed(change.deltaKg)} kg</span>.
                </>
              ) : (
                "."
              )}
            </p>
          ) : (
            <p className="mt-2 text-muted-foreground">Log meals in Nutrition to see your average intake next to your weight trend.</p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">A view of your own data, not advice. Days without logged meals are not counted.</p>
        </Card>
      </StaggerItem>

      {overview.measures.length > 0 ? (
        <StaggerItem>
          <section aria-labelledby="measures-heading">
            <h2 id="measures-heading" className="mb-3 text-lg font-semibold">
              Measurements
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {overview.measures.map((m) => (
                <Card key={m.field} className="p-4">
                  <p className="text-xs font-medium text-muted-foreground">{MEASURE_LABEL[m.field].label}</p>
                  <p className="display-md tnum mt-1">
                    {m.latest} {MEASURE_LABEL[m.field].unit}
                  </p>
                  {m.delta !== null ? <p className="tnum text-xs text-muted-foreground">{signed(m.delta)} since last</p> : null}
                </Card>
              ))}
            </div>
          </section>
        </StaggerItem>
      ) : null}

      <StaggerItem>
        <section aria-labelledby="entries-heading">
          <h2 id="entries-heading" className="mb-3 text-lg font-semibold">
            Entries
          </h2>
          <MeasurementHistory items={overview.history} />
        </section>
      </StaggerItem>
    </Stagger>
  );
}
