# Visual system: "iron and ink"

The look comes from the engraved gym illustrations (navy ink, hatching) and the colours of Olympic plates. Everything below is built from the tokens in `src/app/globals.css` and the motion rules in `docs/motion.md`.

## Surfaces and depth

- **Ambient light**: a soft glow from the top of the screen over the flat ink colour (`--glow`).
- **Paper grain**: a very faint noise layer over everything (`body::after`, `--grain-opacity`). It never intercepts touches.
- **Slab** (`.slab`, used by `Card`): a light edge on top and a lift towards the top, like machined metal.
- **Tactile buttons**: primary and success buttons have an engraved bottom edge that disappears when pressed.
- **Skeletons** sweep with light (`.shimmer`) instead of pulsing.
- **Gold** (`--gold`, `--gold-light`, `--gold-deep`) is reserved for records and the weekly goal.

## Signature effects

| Effect | Where | Files |
|--------|-------|-------|
| Ink stamp: a rubber stamp lands on a finished exercise and stays as a faint mark | Workout logger | `components/ui/ink-stamp.tsx` |
| Sparkline of the last 8 sessions' heaviest weight, drawn once | Exercise card | `components/ui/sparkline.tsx`, `lib/sparkline.ts`, `workouts/domain/trend.ts` |
| Plate calculator: the barbell loads itself plate by plate, plus a warm-up ramp | Set editor ("Plates") | `workouts/components/plate-calculator-sheet.tsx`, `plate-bar.tsx`, `workouts/domain/plates.ts` |
| Week as seven plates: trained days light up in their plate colour, a flash crosses when the goal is met (once per week) | Home | `home/components/week-wheel.tsx`, `home/domain/week-wheel.ts` |
| Muscle heat map: the body coloured by weekly sets, cool to hot like plates | Progress | `analytics/components/muscle-heat-map.tsx`, `analytics/domain/heat.ts` |
| Gold plate with a one-off sweep of light | Record toast, workout summary | `components/ui/gold-plate.tsx` |
| Shareable image of the workout (1080x1350, drawn with Canvas, no library) | Workout summary | `lib/share-card.ts`, `workouts/components/share-button.tsx` |
| Food scan: corner brackets and a sweeping line over the photo, then foods appear one by one with a confidence bar | Food photo | `components/ui/scan-overlay.tsx`, `nutrition/components/food-photo-sheet.tsx` |
| Optional plate "clack" when a set is completed (synthesised, off by default) | Logger, switch on Profile | `lib/sound.ts`, `app/(app)/profile/sound-toggle.tsx` |
| Consistency calendar: the last 12 weeks, a trained day takes its weekday's plate colour; weekly streak shown as a gold plate with the number of weeks | Progress (calendar), Home (streak under the week) | `home/components/consistency-calendar.tsx`, `streak-badge.tsx`, `home/domain/consistency.ts` |
| Day colour bar: each training day carries its plate colour | Logger header | `workout-logger.tsx` |

## The 3D body

The muscle heat map on Progress has a **2D | 3D** switch (shown only where the browser supports WebGL).

- **What it does:** drag to rotate, pinch to zoom, Front/Back buttons, tap a muscle to read its sets this week. Muscles warm up from the neutral tone to their heat colour when the view opens.
- **Two bodies, one viewer:** without a model file a stylised body made of ellipsoids is drawn (`domain/body-parts.ts`). If `public/models/anatomy.glb` exists it is used instead, with its meshes matched to our 12 muscle groups by name (`domain/glb.ts`). See `public/models/README.md` for the format, where to get a model, licences, and `pnpm model:check`.
- **Cost:** the 3D engine (three.js, react-three-fiber) is downloaded only when someone taps 3D. The scene draws only while something moves, so it does not drain the battery. If anything fails (no WebGL, a bad model file) it falls back to the flat map.
- **Files:** `modules/analytics/components/body3d/` (viewer, scene parts, error boundary, config with the model URL and the credit line).

## Rules

- Motion respects the OS "reduce motion" setting (`MotionConfig reducedMotion="user"`): transforms collapse, information stays.
- A decorative effect never delays logging a set and never blocks a tap (`pointer-events-none`).
- Colour carries meaning: green = completed, gold = record, plate colours = day of the week and weight of a plate, cool-to-hot = volume.
- Heavy visuals (body map, charts, detail sheet) are loaded lazily.

## Not done

- **Shared-element transition** (thumbnail growing into the large photo): the detail sheet slides in from the bottom while it opens, so measuring positions mid-flight looks broken. It needs the detail as a full page route; tracked in the backlog.
