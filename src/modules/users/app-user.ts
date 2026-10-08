import "server-only";
import { cache } from "react";
import { requireUser, type SessionUser } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { ensureUserProvisioned } from "./provisioning";

/**
 * Signed-in user whose account is fully set up. Layouts and pages render in parallel, so they all
 * call this: `cache` makes them share one provisioning promise per request, and no page can read
 * settings before they exist.
 */
export const requireAppUser = cache(async (): Promise<SessionUser> => {
  const user = await requireUser();
  await ensureUserProvisioned(user.id, env.DEFAULT_TIMEZONE);
  return user;
});
