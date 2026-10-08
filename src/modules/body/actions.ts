"use server";

import { revalidatePath } from "next/cache";
import { runAction, type ActionResult } from "@/lib/actions";
import { requireUserOrThrow } from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/rate-limit";
import { deleteMeasurement, logMeasurement } from "./service";
import { logMeasurementSchema, measurementIdSchema } from "./validators";

const LIMIT = { limit: 60, windowMs: 60_000 } as const;

function refresh(): void {
  revalidatePath("/body");
  revalidatePath("/");
}

export async function logMeasurementAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const user = await requireUserOrThrow();
    await enforceRateLimit(`body:write:${user.id}`, LIMIT);
    const result = await logMeasurement(user.id, logMeasurementSchema.parse(input));
    refresh();
    return result;
  });
}

export async function deleteMeasurementAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    const user = await requireUserOrThrow();
    await enforceRateLimit(`body:write:${user.id}`, LIMIT);
    const { id } = measurementIdSchema.parse(input);
    await deleteMeasurement(user.id, id);
    refresh();
    return { id };
  });
}
