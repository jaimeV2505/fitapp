import Link from "next/link";
import { ChevronRight, Scale, Trophy } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { LazyWeeklyVolumeChart } from "@/components/lazy-charts";
import { Card } from "@/components/ui/card";
import { Stagger, StaggerItem } from "@/components/ui/stagger";
import { INTL_LOCALE } from "@/lib/i18n/config";
import { titleOf } from "@/lib/i18n/metadata";
import { getI18n } from "@/lib/i18n/server";
import { formatShortDate } from "@/lib/time";
import { MuscleSetsBars } from "@/modules/analytics/components/muscle-sets";
import { getProgressOverview } from "@/modules/analytics/service";
import { requireAppUser } from "@/modules/users/app-user";
import { formatVolume } from "@/modules/workouts/domain/format";
import { getRecentRecords, listHistory } from "@/modules/workouts/service";

export const generateMetadata = titleOf("progress.title");

export default async function ProgressPage() {
  const user = await requireAppUser();
  const { t, locale, name } = await getI18n();
  const intl = INTL_LOCALE[locale];
  const [overview, history, records] = await Promise.all([
    getProgressOverview(user.id),
    listHistory(user.id, 60),
    getRecentRecords(user.id, 6),
  ]);
  const { thisWeek } = overview;

  const tiles = [
    { label: t("progress.workouts"), node: <AnimatedNumber value={thisWeek.sessions} /> },
    { label: t("progress.sets"), node: <AnimatedNumber value={thisWeek.sets} /> },
    { label: t("progress.volumeKg"), node: <AnimatedNumber value={thisWeek.volumeKg} /> },
  ];

  return (
    <Stagger className="flex flex-col gap-6">
      <StaggerItem>
        <h1 className="display-xl">{t("progress.title")}</h1>
      </StaggerItem>

      <StaggerItem>
        <Link href="/body" className="block">
          <Card className="flex items-center gap-3 p-4 transition-transform active:scale-[0.99]">
            <Scale className="size-6 text-primary" />
            <span className="flex-1">
              <span className="block font-semibold">{t("progress.bodyLink")}</span>
              <span className="block text-sm text-muted-foreground">{t("progress.bodyLinkHint")}</span>
            </span>
            <ChevronRight className="size-5 text-muted-foreground" />
          </Card>
        </Link>
      </StaggerItem>

      <StaggerItem>
        <section aria-labelledby="week-heading" className="flex flex-col gap-3">
          <h2 id="week-heading" className="text-lg font-semibold">
            {t("progress.thisWeek")}
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {tiles.map((tile) => (
              <Card key={tile.label} className="p-4">
                <p className="text-xs font-medium text-muted-foreground">{tile.label}</p>
                <p className="display-md mt-1">{tile.node}</p>
              </Card>
            ))}
          </div>
        </section>
      </StaggerItem>

      <StaggerItem>
        <Card className="p-5">
          <h2 className="mb-1 text-lg font-semibold">{t("progress.weeklyVolume")}</h2>
          <p className="mb-4 text-sm text-muted-foreground">{t("progress.weeklyVolumeHint")}</p>
          <LazyWeeklyVolumeChart weeks={overview.weeks} />
        </Card>
      </StaggerItem>

      <StaggerItem>
        <Card className="p-5">
          <h2 className="mb-1 text-lg font-semibold">{t("progress.setsPerMuscle")}</h2>
          <p className="mb-4 text-sm text-muted-foreground">{t("progress.setsPerMuscleHint")}</p>
          <MuscleSetsBars rows={overview.muscleSets} />
        </Card>
      </StaggerItem>

      {records.length > 0 ? (
        <StaggerItem>
          <Card className="p-5">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <Trophy className="size-5 text-primary" /> {t("progress.recentRecords")}
            </h2>
            <ul className="flex flex-col gap-2">
              {records.map((record) => (
                <li key={record.id} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate font-medium">{name(record.exerciseName)}</span>
                  <span className="tnum shrink-0 text-muted-foreground">
                    {record.kind === "weight" ? t("progress.recordWeight", { kg: record.valueKg }) : t("progress.recordE1rm", { kg: record.valueKg })} · {formatShortDate(record.localDate, intl)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </StaggerItem>
      ) : null}

      <StaggerItem>
        <section aria-labelledby="history-heading">
          <h2 id="history-heading" className="mb-3 text-lg font-semibold">
            {t("progress.history")}
          </h2>
          {history.length === 0 ? (
            <Card className="p-6 text-muted-foreground">{t("progress.historyEmpty")}</Card>
          ) : (
            <ul className="flex flex-col gap-3">
              {history.map((session) => (
                <li key={session.id}>
                  <Link href={`/workout/${session.id}`} className="block">
                    <Card className="flex items-center justify-between gap-4 p-4 transition-transform active:scale-[0.99]">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {name(session.focus)}
                          {session.status === "abandoned" ? <span className="font-normal text-muted-foreground">{t("progress.discardedTag")}</span> : null}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t("progress.historyLine", { date: formatShortDate(session.localDate, intl), exercises: session.exerciseCount, sets: session.completedSets })}
                        </p>
                      </div>
                      <p className="tnum shrink-0 text-right font-medium">{formatVolume(session.totalVolumeKg, intl)}</p>
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
