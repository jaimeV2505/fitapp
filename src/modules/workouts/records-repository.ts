import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { exerciseSessions, progressMetrics, workoutSets } from "@/lib/db/schema";
import type { RecordKind } from "./domain/records";

export interface NewRecordRow {
  userId: string;
  kind: RecordKind;
  exerciseId: string;
  exerciseName: string;
  valueKg: number;
  achievedAt: Date;
  sourceSetId: string | null;
}

const TYPE = { weight: "pr_weight", e1rm: "pr_e1rm" } as const;
const KIND = { pr_weight: "weight", pr_e1rm: "e1rm" } as const;

export async function insertRecords(rows: readonly NewRecordRow[]): Promise<void> {
  if (rows.length === 0) return;
  await db.insert(progressMetrics).values(
    rows.map((row) => ({
      userId: row.userId,
      type: TYPE[row.kind],
      exerciseId: row.exerciseId,
      exerciseNameSnapshot: row.exerciseName,
      value: String(row.valueKg),
      achievedAt: row.achievedAt,
      sourceSetId: row.sourceSetId,
    })),
  );
}

export interface StoredRecord {
  id: string;
  kind: RecordKind;
  exerciseName: string;
  valueKg: number;
  achievedAt: Date;
}

function toStored(row: { id: string; type: string; name: string | null; value: string; achievedAt: Date }): StoredRecord | null {
  const kind = KIND[row.type as keyof typeof KIND];
  if (!kind) return null;
  return { id: row.id, kind, exerciseName: row.name ?? "Exercise", valueKg: Number(row.value), achievedAt: row.achievedAt };
}

export async function listRecordsForSession(userId: string, sessionId: string): Promise<StoredRecord[]> {
  const rows = await db
    .select({
      id: progressMetrics.id,
      type: progressMetrics.type,
      name: progressMetrics.exerciseNameSnapshot,
      value: progressMetrics.value,
      achievedAt: progressMetrics.achievedAt,
    })
    .from(progressMetrics)
    .innerJoin(workoutSets, eq(workoutSets.id, progressMetrics.sourceSetId))
    .innerJoin(exerciseSessions, eq(exerciseSessions.id, workoutSets.exerciseSessionId))
    .where(and(eq(progressMetrics.userId, userId), eq(exerciseSessions.sessionId, sessionId)))
    .orderBy(desc(progressMetrics.achievedAt));
  return rows.flatMap((row) => toStored(row) ?? []);
}

export async function listRecentRecords(userId: string, limit: number): Promise<StoredRecord[]> {
  const rows = await db
    .select({
      id: progressMetrics.id,
      type: progressMetrics.type,
      name: progressMetrics.exerciseNameSnapshot,
      value: progressMetrics.value,
      achievedAt: progressMetrics.achievedAt,
    })
    .from(progressMetrics)
    .where(eq(progressMetrics.userId, userId))
    .orderBy(desc(progressMetrics.achievedAt))
    .limit(limit);
  return rows.flatMap((row) => toStored(row) ?? []);
}
