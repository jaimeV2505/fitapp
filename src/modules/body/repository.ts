import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { bodyMeasurements } from "@/lib/db/schema";
import type { MeasurementView } from "./types";

const num = (value: string | null): number | null => (value === null ? null : Number(value));

function toView(row: typeof bodyMeasurements.$inferSelect): MeasurementView {
  return {
    id: row.id,
    localDate: row.localDate,
    weightKg: num(row.weightKg),
    bodyFatPercent: num(row.bodyFatPercent),
    waistCm: num(row.waistCm),
    chestCm: num(row.chestCm),
    armCm: num(row.armCm),
    legCm: num(row.legCm),
    notes: row.notes,
  };
}

export interface NewMeasurement {
  userId: string;
  localDate: string;
  measuredAt: Date;
  weightKg: number | null;
  bodyFatPercent: number | null;
  waistCm: number | null;
  chestCm: number | null;
  armCm: number | null;
  legCm: number | null;
  notes: string | null;
}

const str = (value: number | null): string | null => (value === null ? null : String(value));

export async function insertMeasurement(input: NewMeasurement): Promise<string> {
  const [row] = await db
    .insert(bodyMeasurements)
    .values({
      userId: input.userId,
      localDate: input.localDate,
      measuredAt: input.measuredAt,
      weightKg: str(input.weightKg),
      bodyFatPercent: str(input.bodyFatPercent),
      waistCm: str(input.waistCm),
      chestCm: str(input.chestCm),
      armCm: str(input.armCm),
      legCm: str(input.legCm),
      notes: input.notes,
    })
    .returning({ id: bodyMeasurements.id });
  if (!row) throw new Error("Failed to save measurement");
  return row.id;
}

export async function deleteMeasurementRow(userId: string, id: string): Promise<boolean> {
  const rows = await db
    .delete(bodyMeasurements)
    .where(and(eq(bodyMeasurements.id, id), eq(bodyMeasurements.userId, userId)))
    .returning({ id: bodyMeasurements.id });
  return rows.length > 0;
}

export async function listMeasurementsSince(userId: string, fromDate: string): Promise<(MeasurementView & { measuredAt: string })[]> {
  const rows = await db
    .select()
    .from(bodyMeasurements)
    .where(and(eq(bodyMeasurements.userId, userId), gte(bodyMeasurements.localDate, fromDate)))
    .orderBy(desc(bodyMeasurements.localDate), desc(bodyMeasurements.measuredAt));
  return rows.map((row) => ({ ...toView(row), measuredAt: row.measuredAt.toISOString() }));
}

export async function listRecentMeasurements(userId: string, limit: number): Promise<MeasurementView[]> {
  const rows = await db
    .select()
    .from(bodyMeasurements)
    .where(eq(bodyMeasurements.userId, userId))
    .orderBy(desc(bodyMeasurements.localDate), desc(bodyMeasurements.measuredAt))
    .limit(limit);
  return rows.map(toView);
}
