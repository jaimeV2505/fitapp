/**
 * pnpm db:seed
 *  1. Ensures the built-in exercise and food catalogs exist.
 *  2. Provisions every existing user that has no settings yet with the starter routine and meal templates.
 * Safe to run repeatedly. New users are provisioned automatically on first sign-in as well.
 */
import "dotenv/config";
import { db } from "../src/lib/db";
import { user } from "../src/lib/db/schema";
import { env } from "../src/lib/env";
import { ensureBuiltInExercises, ensureLibraryExercises } from "../src/modules/exercises/catalog";
import { ensureBuiltInFoods } from "../src/modules/foods/catalog";
import { ensureUserProvisioned } from "../src/modules/users/provisioning";

async function main(): Promise<void> {
  const exerciseIds = await ensureBuiltInExercises(db);
  const foodIds = await ensureBuiltInFoods(db);
  console.log(`Catalog ready: ${exerciseIds.size} exercises, ${foodIds.size} foods.`);
  const libraryAdded = await ensureLibraryExercises(db);
  if (libraryAdded > 0) console.log(`Exercise library: added ${libraryAdded} exercises.`);

  const users = await db.select({ id: user.id, email: user.email }).from(user);
  if (users.length === 0) {
    console.log("No users yet. Sign up in the app; the starter routine is created on first sign-in.");
    return;
  }
  for (const entry of users) {
    const created = await ensureUserProvisioned(entry.id, env.DEFAULT_TIMEZONE);
    console.log(`${entry.email}: ${created ? "provisioned" : "already provisioned"}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
