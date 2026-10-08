import Link from "next/link";
import { Card } from "@/components/ui/card";
import { INTL_LOCALE } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { formatShortDate } from "@/lib/time";
import { formatVolume } from "@/modules/workouts/domain/format";
import { listHistory } from "@/modules/workouts/service";

export async function RecentList({ userId }: { userId: string }) {
  const { t, locale, name } = await getI18n();
  const recent = await listHistory(userId, 3);
  const intl = INTL_LOCALE[locale];

  if (recent.length === 0) return <Card className="p-6 text-muted-foreground">{t("home.recentEmpty")}</Card>;

  return (
    <ul className="flex flex-col gap-3">
      {recent.map((session) => (
        <li key={session.id}>
          <Link href={`/workout/${session.id}`} className="block">
            <Card className="flex items-center justify-between p-4 transition-transform active:scale-[0.99]">
              <div>
                <p className="font-semibold">{name(session.focus)}</p>
                <p className="text-sm text-muted-foreground">
                  {formatShortDate(session.localDate, intl)} · {t("home.setsCount", { count: session.completedSets })}
                </p>
              </div>
              <p className="tnum text-right font-medium">{formatVolume(session.totalVolumeKg, intl)}</p>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}
