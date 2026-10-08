# Product

## Vision

A premium, minimal fitness tracker you want to open every time you walk into the gym. Fast enough to log a set in 2-3 seconds, honest enough to never pretend an AI estimate is a measurement.

## Principles

1. The common action is one tap. Values are prefilled from your last workout.
2. Never lose a logged set (poor gym Wi-Fi is the default assumption).
3. Suggest, never decide: no automatic weight changes, no medical targets.
4. Estimates are labelled as estimates and always editable.
5. Calm UI: large numbers, clear hierarchy, green only for completed work, one accent colour, motion only where it confirms an action.

## Screens

| Screen | Purpose | Status |
|--------|---------|--------|
| Today (`/`) | What do I need to do today: workout, week progress, recent activity | Built (nutrition and weight cards arrive with their slices) |
| Workout hub (`/workout`) | Start today's workout or any other day; resumes an active one | Built |
| Workout logger (`/workout/[id]`) | Exercise cards, set editor, rest timer, sync status, finish | Built |
| Workout summary (`/workout/[id]` once finished) | Duration, sets, volume, every logged set | Built |
| History (`/progress`) | Finished workouts | Built (analytics/charts: Phase 3) |
| Nutrition (`/nutrition`) | Daily macros vs your targets, meal log, templates, foods | Built |
| Weekly routine (`/workout`) | See Monday to Friday, pick a day, start it | Built |
| Body (`/body`) | Weight and measurements, trend with moving average, intake vs weight | Built |
| Edit routine (`/workout/plan`) | Add, replace, reorder exercises per day | Built |
| Food photo | Camera, AI estimate, edit, save | Built (needs ANTHROPIC_API_KEY) |
| Library (`/library`) | Search every exercise with photos and how-to | Built |
| Profile (`/profile`) | Account, theme, sign out | Built (targets/units/timezone editing: next) |
| Food photo flow | Camera, AI estimate, edit, save | Phase 2 |

## Navigation

Bottom bar on mobile with a raised centre Workout button (shows a live dot while a workout is running); side rail on desktop.

## Seed data and assumptions

The starter routine and meal templates come from your brief and are data (`src/data/starter/`), never UI text. Assumptions to confirm:

- **Equipment** is left empty when the exercise name does not state it (e.g. Incline Press, Shoulder Press). Weight-step defaults: dumbbell 2 kg, machine 5 kg, otherwise 2.5 kg.
- **"Pec Deck" (Thursday)** and **"Pec Deck / Cable Fly" (Monday)** are one exercise, so history carries across days. **"Leg Curl" (Wednesday)** and **"Seated Leg Curl" (Friday)** are kept as two exercises, as written.
- **RIR guidance** is stored per plan exercise: machines and isolation 0-1 RIR, other compounds 1-2 RIR; isolation exercises allow technical failure on the last set.
- **"Protein shake"** in the pre-workout and before-bed meals is modelled as one scoop (30 g) of protein powder.
- **High calorie shake**: oats 55 g (from 50-60), blueberries 90 g (80-100), peanut butter 22 g (20-25), liquid 300 ml, selectable water or milk. All editable.
- **Food values** are generic per-100 g estimates, flagged `seed_estimate`. Replace them with your labels.
- **Nutrition targets** start empty. The app does not suggest calorie or macro targets.
- **Weekly workout target** defaults to 5 (settings).

## Roadmap

- **Phase 1 (in progress)**: shell and design system, auth, database, seed, today's workout, set logging, finish, history, nutrition schema, manual meals, meal templates, basic dashboard, Docker, Vercel config.
  - Slice 1 (done in code, needs first run): workouts end to end.
  - Slice 2: nutrition (foods CRUD, meal logging, templates, daily dashboard, targets).
  - Slice 3: dashboard completion (nutrition, latest weight), body weight entry.
- **Phase 2**: food photo AI (Claude vision), upload hardening, confidence UI.
- **Phase 3**: analytics (sets/volume per muscle, averages), progressive overload suggestions, exercise history charts, personal records.
- **Phase 4**: PWA install, IndexedDB queue, service-worker sync.
