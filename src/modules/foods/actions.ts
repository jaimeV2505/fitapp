"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/lib/actions";
import { requireUserOrThrow } from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/rate-limit";
import { removeFood, saveFood } from "./service";
import { foodIdSchema, saveFoodSchema } from "./validators";

const LIMIT = { limit: 60, windowMs: 60_000 } as const;

export async function saveFoodAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const user = await requireUserOrThrow();
    await enforceRateLimit(`food:write:${user.id}`, LIMIT);
    const result = await saveFood(user.id, saveFoodSchema.parse(input));
    revalidatePath("/nutrition");
    revalidatePath("/nutrition/foods");
    return result;
  });
}

export async function deleteFoodAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const user = await requireUserOrThrow();
    await enforceRateLimit(`food:write:${user.id}`, LIMIT);
    const { id } = foodIdSchema.parse(input);
    await removeFood(user.id, id);
    revalidatePath("/nutrition");
    revalidatePath("/nutrition/foods");
    return { id };
  });
}
