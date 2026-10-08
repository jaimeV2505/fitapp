"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n/client";

export default function Loading() {
  const t = useT();
  return (
    <div className="flex flex-col gap-6" role="status" aria-label={t("common.loading")}>
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-52 w-full rounded-card" />
      <Skeleton className="h-28 w-full rounded-card" />
      <Skeleton className="h-20 w-full rounded-card" />
    </div>
  );
}
