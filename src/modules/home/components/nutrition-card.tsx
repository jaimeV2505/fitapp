import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Meter } from "@/components/ui/meter";
import { getI18n } from "@/lib/i18n/server";
import { getDailyNutrition } from "@/modules/nutrition/service";

export async function NutritionCard({ userId }: { userId: string }) {
  const { t } = await getI18n();
  const nutrition = await getDailyNutrition(userId);

  return (
    <Link href="/nutrition" className="block">
      <Card className="p-5 transition-transform active:scale-[0.99]">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">{t("home.nutritionToday")}</h2>
          <span className="text-sm text-muted-foreground">{t("common.open")}</span>
        </div>
        <div className="flex flex-col gap-4">
          <Meter label={t("home.calories")} value={nutrition.totals.calories} target={nutrition.targets.calories} unit="kcal" />
          <Meter label={t("home.protein")} value={nutrition.totals.protein} target={nutrition.targets.protein} unit="g" barClassName="bg-plate-blue" />
        </div>
      </Card>
    </Link>
  );
}
