import { getConsistency } from "../service";
import { WeekWheel } from "./week-wheel";

/** The week as seven plates with the weekly streak. Streams in with the rest of the home screen. */
export async function WeekCard({ userId }: { userId: string }) {
  const { wheel, streak } = await getConsistency(userId);
  return <WeekWheel wheel={wheel} streak={streak} />;
}
