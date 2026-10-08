import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { FoodsManager } from "@/modules/foods/components/foods-manager";
import { listFoods } from "@/modules/foods/service";
import { requireAppUser } from "@/modules/users/app-user";

export const metadata = { title: "Foods" };

export default async function FoodsPage() {
  const user = await requireAppUser();
  const foods = await listFoods(user.id);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/nutrition" className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground">
          <ChevronLeft className="size-4" /> Nutrition
        </Link>
        <h1 className="display-xl">Foods</h1>
        <p className="mt-2 text-muted-foreground">
          Values are per 100 g. Edit any food to match your labels: past meals keep the numbers they were logged with.
        </p>
      </header>
      <FoodsManager foods={foods} />
    </div>
  );
}
