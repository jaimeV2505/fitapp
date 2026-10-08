import type { Equipment, MealType, MuscleGroup, QuantityUnit } from "@/lib/db/schema/enums";
import type { Translate } from "./translator";

// Typed template literals: a typo or a new enum value without a translation is a compile error.
export const muscleLabel = (t: Translate, muscle: MuscleGroup): string => t(`muscles.${muscle}`);
export const equipmentLabel = (t: Translate, equipment: Equipment): string => t(`equipment.${equipment}`);
export const mealLabel = (t: Translate, type: MealType): string => t(`mealTypes.${type}`);
export const unitLabel = (t: Translate, unit: QuantityUnit): string => t(`units.${unit}`);
