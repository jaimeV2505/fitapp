import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { titleOf } from "@/lib/i18n/metadata";
import { getT } from "@/lib/i18n/server";
import { FoodsManager } from "@/modules/foods/components/foods-manager";
import { listFoods } from "@/modules/foods/service";
import { requireAppUser } from "@/modules/users/app-user";

export const generateMetadata = titleOf("foods.title");

export default async function FoodsPage() {
  const user = await requireAppUser();
  const [t, foods] = await Promise.all([getT(), listFoods(user.id)]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/nutrition" className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground">
          <ChevronLeft className="size-4" /> {t("nutrition.title")}
        </Link>
        <h1 className="display-xl">{t("foods.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("foods.intro")}</p>
      </header>
      <FoodsManager foods={foods} />
    </div>
  );
}
