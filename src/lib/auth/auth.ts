import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import { account, session, user, verification } from "@/lib/db/schema";
import { appUrl, env, trustedOrigins } from "@/lib/env";

/**
 * Better Auth (the maintained successor to Auth.js). Users live in our own Postgres.
 * The app starts single-user: set ALLOW_SIGNUP=false after creating your account.
 */
export const auth = betterAuth({
  baseURL: appUrl,
  trustedOrigins,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: !env.ALLOW_SIGNUP,
    minPasswordLength: 10,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  // Must be the last plugin so cookies set in server actions are forwarded.
  plugins: [nextCookies()],
});
