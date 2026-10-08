import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { exerciseSessions, workoutSessions, workoutSets } from "@/lib/db/schema";
import type { MuscleSets, WeekTotals } from "./types";

const workingCompleted = sql`${workoutSets.completed} and not ${workoutSets.isWarmup}`;

/** Weekly totals from completed workouts, grouped by the user's week start (ISO weekday, 1 = Monday). */
export async function listWeeklyTotals(userId: string, fromDate: string, weekStartsOn: number): Promise<WeekTotals[]> {
  const weekStart = sql<string>`to_char(${workoutSessions.localDate} - (((extract(isodow from ${workoutSessions.localDate})::int - ${weekStartsOn}::int) + 7) % 7), 'YYYY-MM-DD')`;
  const rows = await db
    .select({
      weekStart,
      sessions: sql<number>`count(distinct ${workoutSessions.id})::int`,
      sets: sql<number>`count(${workoutSets.id}) filter (where ${workingCompleted})::int`,
      volumeKg: sql<number>`coalesce(sum(${workoutSets.weightKg} * ${workoutSets.reps}) filter (where ${workingCompleted}), 0)::float8`,
    })
    .from(workoutSessions)
    .leftJoin(exerciseSessions, eq(exerciseSessions.sessionId, workoutSessions.id))
    .leftJoin(workoutSets, eq(workoutSets.exerciseSessionId, exerciseSessions.id))
    .where(
      and(
        eq(workoutSessions.userId, userId),
        eq(workoutSessions.status, "completed"),
        gte(workoutSessions.localDate, fromDate),
      ),
    )
    // Group by the first selected column. Repeating the expression would number its parameter
    // differently ($1 vs $5), and Postgres would not recognise it as the same expression.
    .groupBy(sql`1`);

  return rows.map((row) => ({ ...row, volumeKg: Math.round(row.volumeKg) }));
}

/** Completed working sets per primary muscle, read from the session snapshots (never the live exercise). */
export async function listMuscleSets(userId: string, startDate: string, endDate: string): Promise<MuscleSets[]> {
  const rows = await db
    .select({
      muscle: exerciseSessions.primaryMuscleSnapshot,
      sets: sql<number>`count(${workoutSets.id})::int`,
    })
    .from(workoutSets)
    .innerJoin(exerciseSessions, eq(exerciseSessions.id, workoutSets.exerciseSessionId))
    .innerJoin(workoutSessions, eq(workoutSessions.id, exerciseSessions.sessionId))
    .where(
      and(
        eq(workoutSessions.userId, userId),
        eq(workoutSessions.status, "completed"),
        gte(workoutSessions.localDate, startDate),
        lte(workoutSessions.localDate, endDate),
        eq(workoutSets.completed, true),
        eq(workoutSets.isWarmup, false),
      ),
    )
    .groupBy(exerciseSessions.primaryMuscleSnapshot)
    .orderBy(desc(sql`count(${workoutSets.id})`));
  return rows;
}

export async function countAllCompleted(userId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(workoutSessions)
    .where(and(eq(workoutSessions.userId, userId), eq(workoutSessions.status, "completed")));
  return row?.count ?? 0;
}
