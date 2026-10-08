import { AppError } from "@/lib/errors";
import {
  archiveOwnFood,
  findVisibleFood,
  insertFood,
  listVisibleFoods,
  overrideBuiltInFood,
  slugExistsForOwner,
  updateOwnFood,
  type FoodWrite,
} from "./repository";
import type { SaveFoodInput } from "./validators";
import type { FoodView } from "./types";

export const listFoods = listVisibleFoods;

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base === "" ? "food" : base;
}

function toWrite(input: SaveFoodInput): FoodWrite {
  return {
    name: input.name,
    brand: input.brand?.trim() ? input.brand.trim() : null,
    caloriesPer100: input.caloriesPer100,
    proteinPer100: input.proteinPer100,
    carbsPer100: input.carbsPer100,
    fatPer100: input.fatPer100,
    pieceLabel: input.pieceLabel?.trim() ? input.pieceLabel.trim() : null,
    pieceGrams: input.pieceGrams ?? null,
  };
}

/** Creates a food, edits your own, or (for a built-in) creates your own edited copy. Returns the food id to use. */
export async function saveFood(userId: string, input: SaveFoodInput): Promise<{ id: string }> {
  const write = toWrite(input);

  if (!input.id) {
    let slug = slugify(write.name);
    for (let attempt = 2; await slugExistsForOwner(userId, slug); attempt += 1) slug = `${slugify(write.name)}-${attempt}`;
    return { id: await insertFood(userId, slug, write) };
  }

  const existing = await findVisibleFood(userId, input.id);
  if (!existing) throw new AppError("not_found", "This food no longer exists.");

  if (existing.ownerId === userId) {
    await updateOwnFood(userId, existing.id, write);
    return { id: existing.id };
  }
  return { id: await overrideBuiltInFood(userId, { id: existing.id, slug: existing.slug }, write) };
}

export async function removeFood(userId: string, foodId: string): Promise<void> {
  const existing = await findVisibleFood(userId, foodId);
  if (!existing) throw new AppError("not_found", "This food no longer exists.");
  if (existing.ownerId !== userId) throw new AppError("conflict", "Built-in foods cannot be deleted. Edit it to make your own version.");
  await archiveOwnFood(userId, foodId);
}

export type { FoodView };
