import Link from "next/link";
import { Card } from "@/components/ui/card";
import { INTL_LOCALE } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { formatShortDate } from "@/lib/time";
import { getLatestWeight } from "@/modules/body/service";

export async function WeightCard({ userId }: { userId: string }) {
  const { t, locale } = await getI18n();
  const weight = await getLatestWeight(userId);

  return (
    <Link href="/body" className="block">
      <Card className="flex items-center justify-between p-5 transition-transform active:scale-[0.99]">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{t("home.latestWeight")}</p>
          <p className="display-lg mt-1">{weight ? `${weight.weightKg} kg` : t("home.logYourWeight")}</p>
          {weight ? <p className="text-sm text-muted-foreground">{formatShortDate(weight.localDate, INTL_LOCALE[locale])}</p> : null}
        </div>
        <span className="text-sm text-muted-foreground">{t("common.open")}</span>
      </Card>
    </Link>
  );
}
