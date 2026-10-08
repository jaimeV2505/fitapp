import type { DbExecutor } from "@/lib/db";
import { workoutDayExercises, workoutDays, workoutPlans } from "@/lib/db/schema";
import { EXERCISE_CATALOG } from "@/data/starter/exercise-catalog";
import { STARTER_PLAN_DAYS, STARTER_PLAN_NAME, intensityFor } from "@/data/starter/workout-plan";

/** Creates the starter routine for a user from seed data. `exerciseIdBySlug` comes from ensureBuiltInExercises. */
export async function createStarterPlan(
  executor: DbExecutor,
  userId: string,
  exerciseIdBySlug: ReadonlyMap<string, string>,
): Promise<string> {
  const [plan] = await executor
    .insert(workoutPlans)
    .values({ userId, name: STARTER_PLAN_NAME, isActive: true })
    .returning({ id: workoutPlans.id });
  if (!plan) throw new Error("Failed to create starter plan");

  for (const [dayIndex, day] of STARTER_PLAN_DAYS.entries()) {
    const [dayRow] = await executor
      .insert(workoutDays)
      .values({
        planId: plan.id,
        name: day.name,
        focus: day.focus,
        weekday: day.weekday,
        position: dayIndex,
      })
      .returning({ id: workoutDays.id });
    if (!dayRow) throw new Error(`Failed to create plan day ${day.name}`);

    const rows = day.items.map((entry, position) => {
      const exerciseId = exerciseIdBySlug.get(entry.exerciseSlug);
      const catalogEntry = EXERCISE_CATALOG.find((e) => e.slug === entry.exerciseSlug);
      if (!exerciseId || !catalogEntry) {
        throw new Error(`Starter plan references unknown exercise "${entry.exerciseSlug}"`);
      }
      const intensity = intensityFor(catalogEntry);
      return {
        workoutDayId: dayRow.id,
        exerciseId,
        position,
        targetSets: entry.sets,
        repMin: entry.repMin,
        repMax: entry.repMax,
        targetRirMin: intensity.targetRirMin,
        targetRirMax: intensity.targetRirMax,
        allowFailureOnLastSet: intensity.allowFailureOnLastSet,
      };
    });
    await executor.insert(workoutDayExercises).values(rows);
  }

  return plan.id;
}
