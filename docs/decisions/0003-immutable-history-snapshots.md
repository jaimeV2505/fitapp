# 0003 History is snapshotted, not referenced

Status: accepted (2026-10-08)

## Context
Editing today's plan must not corrupt previous workouts or meals.

## Decision
Starting a workout copies display and analysis data (names, muscles, equipment, targets, RIR targets, rest time) into `exercise_sessions` and creates all `workout_sets` rows. Logging a meal copies nutrition values into `meal_items`. Links back to plan/catalog rows are nullable with `ON DELETE SET NULL`. Analytics read snapshot columns.

## Consequences
- Small storage duplication, zero history drift.
- Editing a food or plan only affects future logging.
- Exercise-level history (charts) joins on `exercise_id`; if a link was nulled, history remains readable but is no longer grouped with the exercise.
