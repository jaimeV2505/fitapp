import { z } from "zod";

const optional = (min: number, max: number) => z.number().min(min).max(max).nullable().optional();

export const logMeasurementSchema = z
  .object({
    localDate: z.iso.date().optional(),
    weightKg: optional(20, 400),
    bodyFatPercent: optional(2, 70),
    waistCm: optional(30, 250),
    chestCm: optional(30, 250),
    armCm: optional(10, 100),
    legCm: optional(20, 150),
    notes: z.string().trim().max(200).nullable().optional(),
  })
  .refine(
    (m) => [m.weightKg, m.bodyFatPercent, m.waistCm, m.chestCm, m.armCm, m.legCm].some((v) => v !== null && v !== undefined),
    { message: "Enter at least one measurement.", path: ["weightKg"] },
  );

export const measurementIdSchema = z.object({ id: z.uuid() });
export const rangeSchema = z.object({ range: z.enum(["7", "30", "90"]).default("30") });

export type LogMeasurementInput = z.infer<typeof logMeasurementSchema>;
