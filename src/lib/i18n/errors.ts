import type { MessageParams } from "./format";
import type { Translate } from "./translator";
import type { MessageKey } from "./types";

/**
 * Server errors are written in English where they are thrown (readable in logs); this table maps each English
 * message to its translation key so the user sees them in their own language. A test checks that every
 * `new AppError(...)` message in the code base is listed here.
 */
export const ERROR_KEYS: Readonly<Record<string, MessageKey>> = {
  "Another set was added at the same time. Try again.": "errors.setAddedConcurrently",
  "Built-in foods cannot be deleted. Edit it to make your own version.": "errors.builtInFoodDelete",
  "I could not find food in that photo. Try a closer, well-lit shot from above.": "errors.noFoodInPhoto",
  "No photo received. Try again.": "errors.noPhoto",
  "One of the exercises is no longer available. Pick it again.": "errors.exerciseUnavailable",
  "One of the foods no longer exists. Pick it again.": "errors.foodGoneOne",
  "Only extra sets that are not completed can be removed.": "errors.onlyExtraSets",
  "Photo estimates need an Anthropic API key. Add ANTHROPIC_API_KEY to your .env and restart the app.": "errors.noApiKey",
  "That photo is too large. Try a smaller one.": "errors.photoTooLarge",
  "That workout day no longer exists.": "errors.dayGone",
  "The estimate failed. Try again, or log the meal by hand.": "errors.estimateFailed",
  "This entry no longer exists.": "errors.entryGone",
  "This estimate is no longer available. Take the photo again.": "errors.estimateGone",
  "This exercise can no longer be edited.": "errors.exerciseNotEditable",
  "This exercise no longer exists.": "errors.exerciseGone",
  "This food no longer exists.": "errors.foodGone",
  "This meal no longer exists.": "errors.mealGone",
  "This photo was already saved as a meal.": "errors.photoAlreadySaved",
  "This set can no longer be edited.": "errors.setNotEditable",
  "This workout day has no exercises yet.": "errors.dayEmpty",
  "This workout is already finished or no longer exists.": "errors.workoutFinished",
  "Use a JPEG, PNG or WebP photo.": "errors.badFormat",
  "You cannot log a measurement in the future.": "errors.futureMeasurement",
  "You cannot log meals that far in the future.": "errors.futureMeal",
  "{name} has no piece size. Use grams instead, or set a piece size on the food.": "errors.noPieceSize",
  "Too many requests. Try again in a moment.": "errors.tooMany",
  "Some values are invalid.": "errors.invalid",
  "You are signed out. Sign in again.": "errors.signedOut",
  "Something went wrong. Try again.": "errors.internal",
};

export function translateError(template: string, params: MessageParams, t: Translate): string {
  const key = ERROR_KEYS[template];
  return key ? t(key, params) : template;
}
