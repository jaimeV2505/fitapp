import { notFound } from "next/navigation";
import { titleOf } from "@/lib/i18n/metadata";
import { requireAppUser } from "@/modules/users/app-user";
import { getUserSettings } from "@/modules/settings/repository";
import { WorkoutLogger } from "@/modules/workouts/components/workout-logger";
import { WorkoutSummary } from "@/modules/workouts/components/workout-summary";
import { getSession, getSessionRecords } from "@/modules/workouts/service";
import { sessionIdSchema } from "@/modules/workouts/validators";

export const generateMetadata = titleOf("nav.workout");

export default async function WorkoutSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ done?: string }>;
}) {
  const user = await requireAppUser();
  const parsed = sessionIdSchema.safeParse({ sessionId: (await params).sessionId });
  if (!parsed.success) notFound();

  const [session, settings] = await Promise.all([
    getSession(user.id, parsed.data.sessionId),
    getUserSettings(user.id),
  ]);
  if (!session) notFound();

  if (session.status === "in_progress") {
    return <WorkoutLogger initialSession={session} restTimerEnabled={settings.restTimerEnabled} />;
  }
  const [{ done }, records] = await Promise.all([searchParams, getSessionRecords(user.id, session.id)]);
  return <WorkoutSummary session={session} celebrate={done === "1"} records={records} />;
}
