# Backlog

## Roadmap (agreed order)
1. Quality and base: migrations, Playwright, backups (written; needs first run)
2. PWA and offline mode
3. Motion phase 2 (nutrition AI, charts, Progress)
4. Weekly summary and plateau detector
5. CSV export and consistency calendar
6. Onboarding and billing (only when opening to others)

## Phase 1
- [ ] Get a real anatomy model (Z-Anatomy / BodyParts3D / paid), prepare it, `pnpm model:check`, add `public/models/anatomy.glb` and `MODEL_CREDIT`
- [ ] 3D: tap a muscle to open the exercises that train it; exercise detail highlights its muscles in 3D
- [ ] Photos and instructions for the base exercises (an AI-written or licensed set), Spanish instructions
- [ ] Shared-element transition: exercise detail as a full page route so the thumbnail can grow into the photo
- [ ] Lote 1 leftovers: streaks and consistency calendar, repeat yesterday's meal / favourites
- [ ] Verify region match (Neon vs. Vercel functions) and measure again
- [ ] Store the language in the user's settings (cross-device) instead of only a cookie
- [ ] Translate exercise instructions / library names (or add an AI translation cache)
- [ ] Motion phase 2: nutrition AI loading/results, animated charts, Progress/Body/Plan editor, Home (see docs/motion.md)
- [ ] Run `pnpm media:library` + `pnpm db:seed` to load the full exercise library
- [ ] Edit a saved meal (amounts, foods) instead of delete + re-log
- [ ] Licensed illustration set (e.g. WorkoutLabs, licensed per use) if the engraved-art look is wanted for the SaaS; check licence before shipping any stock art
- [ ] Run `pnpm media:sync`, review fuzzy matches, then `pnpm db:seed`
- [ ] Self-host exercise photos via StorageProvider (avoid depending on GitHub/CDN)
- [ ] Install, typecheck, lint, test; fix drift
- [ ] Commit the generated `drizzle/` folder and `pnpm-lock.yaml`; run the first backup + `db:verify-backup`
- [ ] Run the e2e suite once locally, fix any selector drift, then enable CI
- [ ] Playwright: sign in, start, log set, refresh, finish
- [ ] Nutrition: foods list/edit, meal logging, template logging (option groups), daily totals, settings targets
- [ ] Settings screen: timezone, units, week start, weekly target, rest timer
- [ ] Plan editor (edit days/exercises/targets)
- [ ] Skip exercise; reorder exercises within a workout

## Phase 2
- [ ] Try the photo flow with real meals; tune the prompt if estimates are consistently off
- [ ] Show per-user AI usage (analyses this month)

## Phase 3
- [ ] Exercise history + charts (Recharts), PRs, weekly analytics, body trends 7/30/90

## Phase 4
- [ ] PWA manifest + install, IndexedDB queue, service-worker sync, offline add-set

## Open questions for the owner
- Phase 3 muscle-set attribution: the seeded routine gives direct weekly sets of chest 15, back 17, quads 17, hamstrings 10, shoulders 16 (incl. reverse pec deck), biceps 12, triceps 12. The brief's example numbers differ slightly, so decide the counting rule (direct only vs fractional secondary credit; rear delts under shoulders or separate).

## Follow-ups from session 4
- [ ] Plan editor: add/rename/delete days and move an exercise between days
- [ ] Records: show the previous record next to a new one; per-exercise record list in the detail sheet
- [ ] Photo flow: save favourite AI meals as templates
