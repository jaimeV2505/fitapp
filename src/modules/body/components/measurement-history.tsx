"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { useIntlLocale, useT } from "@/lib/i18n/client";
import type { Translate } from "@/lib/i18n/translator";
import { formatShortDate } from "@/lib/time";
import { deleteMeasurementAction } from "../actions";
import type { MeasurementView } from "../types";

function summary(m: MeasurementView, t: Translate): string {
  const parts = [
    m.weightKg !== null ? `${m.weightKg} kg` : null,
    m.bodyFatPercent !== null ? t("body.fatShort", { value: m.bodyFatPercent }) : null,
    m.waistCm !== null ? t("body.waistShort", { value: m.waistCm }) : null,
    m.chestCm !== null ? t("body.chestShort", { value: m.chestCm }) : null,
    m.armCm !== null ? t("body.armShort", { value: m.armCm }) : null,
    m.legCm !== null ? t("body.legShort", { value: m.legCm }) : null,
  ];
  return parts.filter(Boolean).join(" · ");
}

export function MeasurementHistory({ items }: { items: MeasurementView[] }) {
  const router = useRouter();
  const t = useT();
  const intl = useIntlLocale();
  const [pending, startTransition] = useTransition();

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteMeasurementAction({ id });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t("body.entryDeleted"));
      router.refresh();
    });
  }

  if (items.length === 0) return <Card className="p-6 text-muted-foreground">{t("body.noEntries")}</Card>;

  return (
    <ul className="flex flex-col gap-2" aria-busy={pending}>
      {items.map((item) => (
        <li key={item.id}>
          <Card className="flex items-center justify-between gap-3 p-3 pl-4">
            <div className="min-w-0">
              <p className="tnum truncate font-semibold">{summary(item, t)}</p>
              <p className="text-sm text-muted-foreground">{formatShortDate(item.localDate, intl)}</p>
            </div>
            <button
              type="button"
              onClick={() => remove(item.id)}
              disabled={pending}
              aria-label={t("body.deleteEntry", { date: formatShortDate(item.localDate, intl) })}
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
            >
              <Trash2 className="size-4" />
            </button>
          </Card>
        </li>
      ))}
    </ul>
  );
}
