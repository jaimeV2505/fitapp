"use client";

import { motion } from "motion/react";
import { listItem, staggerContainer } from "@/lib/motion";
import { Trophy } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CountUp } from "@/components/ui/animated-number";
import { ExerciseThumb } from "@/modules/exercises/components/exercise-thumb";
import { formatShortDate } from "@/lib/time";
import { formatDuration, formatWeight } from "../domain/format";
import { computeSessionProgress, countsAsWorkingSet } from "../domain/metrics";
import type { RecordSummary, SessionView } from "../types";

const STAT_VARIANTS = staggerContainer(0.06);

// The GSAP sequence is only needed right after finishing a workout, so it is not in the main bundle.
const FinishedCelebration = dynamic(() => import("./finished-celebration"), {
  ssr: false,
  loading: () => <div className="h-52" aria-hidden />,
});

interface WorkoutSummaryProps {
  session: SessionView;
  /** True right after finishing: plays the one celebratory moment. */
  celebrate: boolean;
  records: RecordSummary[];
}

export function WorkoutSummary({ session, celebrate, records }: WorkoutSummaryProps) {
  const progress = computeSessionProgress(session.exercises);
  const durationSeconds =
    session.completedAt === null ? 0 : (new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 1000;
  const discarded = session.status === "abandoned";

  const pathname = usePathname();

  useEffect(() => {
    if (!celebrate) return;
    // Drop ?done=1 so a refresh does not replay the celebration.
    window.history.replaceState(null, "", pathname);
  }, [celebrate, pathname]);

  const stats = [
    { label: "Duration", node: <span className="tnum">{formatDuration(durationSeconds)}</span> },
    { label: "Sets", node: <CountUp value={progress.setsCompleted} /> },
    { label: "Volume", node: <CountUp value={progress.totalVolumeKg} suffix=" kg" /> },
  ];

  return (
    <div className="flex flex-col gap-6">
      {celebrate && !discarded ? (
        <FinishedCelebration
          focus={session.focus}
          name={session.name}
          durationLabel={formatDuration(durationSeconds)}
          sets={progress.setsCompleted}
          volumeKg={progress.totalVolumeKg}
          exercisesDone={progress.exercisesCompleted}
          exercisesTotal={progress.exercisesTotal}
          recordsCount={records.length}
        />
      ) : (
        <>
          <header>
            <p className="text-sm font-medium text-muted-foreground">{discarded ? "Discarded" : formatShortDate(session.localDate)}</p>
            <h1 className="display-xl truncate">{session.focus}</h1>
          </header>

          <motion.div className="grid grid-cols-3 gap-3" variants={STAT_VARIANTS} initial="hidden" animate="show">
            {stats.map((stat) => (
              <motion.div key={stat.label} variants={listItem}>
                <Card className="p-4">
                  <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                  <p className="font-display mt-1 text-2xl font-bold tracking-tight">{stat.node}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </>
      )}

      {records.length > 0 ? (
        <section aria-labelledby="records-heading" className="flex flex-col gap-2 rounded-2xl border border-primary/40 bg-card p-4">
          <h2 id="records-heading" className="flex items-center gap-2 text-lg font-semibold">
            <Trophy className="size-5 text-primary" /> New records
          </h2>
          <ul className="flex flex-col gap-1">
            {records.map((record) => (
              <li key={record.id} className="flex justify-between gap-4 text-sm">
                <span className="font-medium">{record.exerciseName}</span>
                <span className="tnum text-muted-foreground">
                  {record.kind === "weight" ? `${record.valueKg} kg, heaviest yet` : `est. 1RM ${record.valueKg} kg`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="exercises-heading" className="flex flex-col gap-3">
        <h2 id="exercises-heading" className="text-lg font-semibold">
          Exercises
        </h2>
        {session.exercises.map((exercise) => {
          const done = exercise.sets.filter(countsAsWorkingSet);
          return (
            <Card key={exercise.id} className="p-4">
              <div className="flex items-center gap-3">
                <ExerciseThumb src={exercise.imageUrls[0]} name={exercise.name} muscle={exercise.primaryMuscle} className="size-12" sizes="48px" />
                <p className="font-semibold">{exercise.name}</p>
              </div>
              {done.length === 0 ? (
                <p className="mt-1 text-sm text-muted-foreground">Skipped</p>
              ) : (
                <ul className="tnum mt-2 flex flex-col gap-1 text-sm">
                  {done.map((set) => (
                    <li key={set.id} className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Set {set.setNumber}</span>
                      <span className="font-medium">
                        {set.weightKg === null ? "" : `${formatWeight(set.weightKg)} kg × `}
                        {set.reps}
                        {set.rir === null ? "" : ` · RIR ${set.rir}`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </section>

      <Button asChild variant="secondary" size="lg">
        <Link href="/progress">Back to history</Link>
      </Button>
    </div>
  );
}
