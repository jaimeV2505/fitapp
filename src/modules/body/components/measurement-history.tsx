"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { formatShortDate } from "@/lib/time";
import { deleteMeasurementAction } from "../actions";
import type { MeasurementView } from "../types";

function summary(m: MeasurementView): string {
  const parts = [
    m.weightKg !== null ? `${m.weightKg} kg` : null,
    m.bodyFatPercent !== null ? `${m.bodyFatPercent}% fat` : null,
    m.waistCm !== null ? `waist ${m.waistCm}` : null,
    m.chestCm !== null ? `chest ${m.chestCm}` : null,
    m.armCm !== null ? `arm ${m.armCm}` : null,
    m.legCm !== null ? `leg ${m.legCm}` : null,
  ];
  return parts.filter(Boolean).join(" · ");
}

export function MeasurementHistory({ items }: { items: MeasurementView[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteMeasurementAction({ id });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Entry deleted");
      router.refresh();
    });
  }

  if (items.length === 0) return <Card className="p-6 text-muted-foreground">No entries yet. Log your first weigh-in above.</Card>;

  return (
    <ul className="flex flex-col gap-2" aria-busy={pending}>
      {items.map((item) => (
        <li key={item.id}>
          <Card className="flex items-center justify-between gap-3 p-3 pl-4">
            <div className="min-w-0">
              <p className="tnum truncate font-semibold">{summary(item)}</p>
              <p className="text-sm text-muted-foreground">{formatShortDate(item.localDate)}</p>
            </div>
            <button
              type="button"
              onClick={() => remove(item.id)}
              disabled={pending}
              aria-label={`Delete entry from ${formatShortDate(item.localDate)}`}
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
