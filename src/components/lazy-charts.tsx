"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Charts pull in recharts (a large library). They are loaded only on the screens that show them, after the
 * rest of the page, with a placeholder of the same height so nothing jumps.
 */
export const LazyWeeklyVolumeChart = dynamic(() => import("@/modules/analytics/components/weekly-volume-chart").then((m) => m.WeeklyVolumeChart), {
  ssr: false,
  loading: () => <Skeleton className="h-52 w-full" />,
});

export const LazyWeightChart = dynamic(() => import("@/modules/body/components/weight-chart").then((m) => m.WeightChart), {
  ssr: false,
  loading: () => <Skeleton className="h-56 w-full" />,
});

export const LazyHistoryChart = dynamic(() => import("@/modules/exercises/components/history-chart").then((m) => m.HistoryChart), {
  ssr: false,
  loading: () => <Skeleton className="h-48 w-full" />,
});
