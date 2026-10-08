# Motion system

Goal: a premium, fast, calm feel on a phone in the gym. Motion confirms what you did and shows what changed; it never decorates.

## Stack and why

| Tool | Role |
|------|------|
| **Motion for React** (`motion`, import from `motion/react`) | Everything state-driven: entrances, taps, layout changes, shared-layout indicators, list reordering. Replaces `framer-motion` (same API, renamed package). |
| **GSAP** (`gsap` + `@gsap/react`) | Only one place: the "workout finished" sequence (`finished-celebration.tsx`), a multi-step timeline (ring draw, check pop, title, stats, count-ups, confetti on the pop). Loaded lazily with `next/dynamic`, so it is not in the main bundle. |
| **NumberFlow** (`@number-flow/react`) | Live numbers whose digits roll (percent, kcal, macros). |
| **canvas-confetti** | Short bursts for records and finishing. |
| **sonner** | Toasts (custom record toast animates with Motion). |
| **vaul** | Bottom sheets (drag to dismiss). |
| **recharts** | Charts; draw animation is switched off under reduced motion. |

APIs were checked against the official docs (motion.dev for `MotionConfig`/`useReducedMotion`; GSAP's React guide for `useGSAP`, scoping and cleanup). The Context7 and 21st MCP servers were not connected in the authoring session.

## Where things live

```
src/lib/motion/
  tokens.ts      durations, easings, springs, distances (the only source of numbers)
  variants.ts    fadeUp, popIn, slideSwap, collapse, stagger/listItem, press, hoverLift
  provider.tsx   <MotionProvider>: MotionConfig reducedMotion="user" (mounted once in components/providers.tsx)
  hooks.ts       useMotionSafe() (for things Motion cannot gate: charts, GSAP, canvas), useHaptics()
src/lib/celebrate.ts          confetti ("pr" small burst, "finish" bigger)
src/components/ui/            animated-number (NumberFlow + CountUp), animated-check, stagger, progress-ring, meter
```

## Rules

1. **Numbers come from tokens.** No ad-hoc durations or springs in components.
2. **Fast.** Most things 120-250 ms; springs for anything that follows a finger or settles.
3. **Earn the motion.** Motion answers an action (a set completed, a record, an exercise done) or helps orientation (the active-set ring glides, the nav indicator slides). One orchestrated entrance per screen, not fade-ins everywhere.
4. **Reduced motion keeps the information.** `MotionConfig reducedMotion="user"` disables transform and layout animation but keeps opacity and colour, so completed sets still change colour and badges still appear. Charts use `useMotionSafe`; GSAP uses `gsap.matchMedia("(prefers-reduced-motion: no-preference)")`; confetti is skipped; CSS ping/pulse are disabled.
5. **Never block input.** Animations never delay saving a set. Exit animations are short (<=140 ms) and a double-tap guard stops accidental duplicate saves while an editor animates out.
6. **Layout through Motion only.** Cards use `layout="position"` so neighbours glide when a card grows; content is never stretched.
7. **Haptics are optional** (`navigator.vibrate`, ignored where unsupported).

## What is animated on the Workout screen

- Page transition (template), exercise list entrance (short stagger), cards gliding when one expands or collapses.
- Set chips: tap feedback, the active-set ring glides from chip to chip (`layoutId`), completed chip pops and its check draws itself, a gold pulse on a record.
- Set editor swaps with a quick slide when the next set opens; RIR selection slides one pill; stepper buttons give tap feedback; the "Try X kg" suggestion appears in place.
- Exercise completion: a success wash over the card, the "Completed" badge pops, the next exercise opens and scrolls into view, toast says what is next.
- Personal records: custom toast with a pulsing trophy, one compact confetti burst, haptic pattern.
- Header: ring springs to the new percent, percent digits roll, sync status swaps with a short slide.
- Rest timer: slides up, ready state gives two soft beats and turns green.
- Finish: the confirm/discard panel cross-fades; after finishing, the GSAP sequence plays once (celebrate only right after finishing, never on a reload).
- Bottom navigation: tap scale, sliding active indicator, centre action button reacts to press and shows a live dot while a workout runs.

## Next phases (not done yet)

- Nutrition: AI estimate loading (scanning shimmer over the photo, items appearing one by one), animated macro rings/bars on results.
- Progress and Body: chart entrance and range-change transitions, number roll-ups.
- Plan editor: drag lift/drop settle polish; Home: hero micro-interactions.
- Optional: `LazyMotion` + `m` components to shrink the Motion bundle once the animation surface is stable.
