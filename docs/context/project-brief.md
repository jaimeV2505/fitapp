# Project brief

Owner: Jaime. Fitness tracker web app, built for personal gym use first, architected to become a multi-user SaaS.

Core promise: open the app in the gym and log a set in 2-3 seconds.

Features: gym workouts (sets/reps/weight/RIR, completion, progressive overload advice), exercise history and charts, nutrition (meals, templates, daily macro dashboard), food photo calorie/macro estimation with Claude vision (always an editable estimate), body weight and measurements, weekly analytics.

Stack: Next.js 16 App Router, TypeScript, React 19, Tailwind 4, shadcn-style UI primitives, Framer Motion, PostgreSQL, Drizzle, Zod, Better Auth, Anthropic API (server-side), Recharts (Phase 3), Vitest, Playwright, Docker Compose for local, Vercel for production, pnpm.

Phases: 1 vertical slice (workouts, then nutrition, then dashboard), 2 food photo AI, 3 analytics and progressive overload, 4 PWA/offline.

Full original requirements: `docs/product.md` (summary) and the owner's brief. The training and nutrition seed data in `src/data/starter/` is the owner's current routine.
