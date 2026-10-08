import media from "./exercise-media.json";

export interface ExerciseMedia {
  /** Id in the free-exercise-db dataset (public domain, Unlicense). */
  id: string;
  images: string[];
  /** Step-by-step instructions, one step per entry. */
  instructions: string[];
}

/**
 * Demo photos and instructions for the built-in exercises, keyed by our exercise slug.
 * Generated and verified by `pnpm media:sync` (scripts/sync-exercise-media.ts); the committed file
 * holds best-effort ids. Exercises without an entry (or with a dead link) fall back to a drawn tile in the UI.
 */
export const EXERCISE_MEDIA: Readonly<Record<string, ExerciseMedia>> = media;
