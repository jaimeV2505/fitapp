export interface TrendRow {
  exerciseId: string;
  sessionId: string;
  /** ISO timestamp the session started. */
  startedAt: string;
  topWeightKg: number | null;
}

/**
 * Heaviest weight per finished session for each exercise, oldest first, keeping the most recent `limit`
 * sessions. Sessions without a weight (bodyweight work) are skipped.
 */
export function buildTrends(rows: readonly TrendRow[], limit = 8): Map<string, number[]> {
  const byExercise = new Map<string, TrendRow[]>();
  for (const row of rows) {
    if (row.topWeightKg === null) continue;
    byExercise.set(row.exerciseId, [...(byExercise.get(row.exerciseId) ?? []), row]);
  }
  const result = new Map<string, number[]>();
  for (const [exerciseId, list] of byExercise) {
    const recent = [...list].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, limit);
    result.set(
      exerciseId,
      recent.reverse().map((row) => row.topWeightKg as number),
    );
  }
  return result;
}
