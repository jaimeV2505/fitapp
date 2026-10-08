import type { DbExecutor } from "@/lib/db";
import { mealTemplateItems, mealTemplates } from "@/lib/db/schema";
import { STARTER_MEAL_TEMPLATES } from "@/data/starter/meal-templates";

/** Creates the starter meal templates for a user. `foodIdBySlug` comes from ensureBuiltInFoods. */
export async function createStarterMealTemplates(
  executor: DbExecutor,
  userId: string,
  foodIdBySlug: ReadonlyMap<string, string>,
): Promise<void> {
  for (const [index, template] of STARTER_MEAL_TEMPLATES.entries()) {
    const [row] = await executor
      .insert(mealTemplates)
      .values({ userId, name: template.name, mealType: template.mealType, position: index })
      .returning({ id: mealTemplates.id });
    if (!row) throw new Error(`Failed to create meal template ${template.name}`);

    const items = template.items.map((entry, position) => {
      const foodId = foodIdBySlug.get(entry.foodSlug);
      if (!foodId) throw new Error(`Starter template references unknown food "${entry.foodSlug}"`);
      return {
        templateId: row.id,
        foodId,
        quantity: String(entry.quantity),
        unit: entry.unit,
        position,
        optionGroup: entry.optionGroup ?? null,
        isDefaultOption: entry.isDefaultOption ?? true,
      };
    });
    await executor.insert(mealTemplateItems).values(items);
  }
}
