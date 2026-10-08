import { AppShell } from "@/components/shell/app-shell";
import { requireAppUser } from "@/modules/users/app-user";
import { findActiveSessionId } from "@/modules/workouts/service";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAppUser();
  const activeSessionId = await findActiveSessionId(user.id);
  return <AppShell activeSessionId={activeSessionId}>{children}</AppShell>;
}
