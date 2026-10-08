import { getWeekWheel } from "../service";
import { WeekWheel } from "./week-wheel";

/** The week as seven plates (replaces the plain counter). Streams in with the rest of the home screen. */
export async function WeekCard({ userId }: { userId: string }) {
  const wheel = await getWeekWheel(userId);
  return <WeekWheel wheel={wheel} />;
}
