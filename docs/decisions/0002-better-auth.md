# 0002 Better Auth instead of Auth.js

Status: accepted (2026-10-08)

## Context
Brief allows "Auth.js or another robust solution". Auth.js (NextAuth v5) is now maintained by the Better Auth project, and new projects are directed to Better Auth. Credentials login is awkward in Auth.js.

## Decision
Better Auth with the Drizzle adapter, email + password, `nextCookies()` plugin. `ALLOW_SIGNUP=false` closes registration once the owner has an account.

## Consequences
- Users, sessions and accounts live in our Postgres; domain tables reference `user.id` (text).
- OAuth, passkeys, organisations can be added later without changing domain code.
- Layout guards are UX only; every server action re-checks the session (`requireUserOrThrow`).
- Auth table shape follows Better Auth defaults; regenerate with its CLI if a plugin adds columns.
