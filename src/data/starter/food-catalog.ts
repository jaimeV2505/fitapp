export interface CatalogFood {
  slug: string;
  name: string;
  caloriesPer100: number;
  proteinPer100: number;
  carbsPer100: number;
  fatPer100: number;
  pieceLabel?: string;
  pieceGrams?: number;
}

/**
 * Generic reference values per 100 g (or 100 ml). They are approximations used to get started
 * and are editable in the app: replace them with the numbers from your own labels.
 */
export const FOOD_CATALOG: readonly CatalogFood[] = [
  { slug: "egg-whole", name: "Egg (whole)", caloriesPer100: 143, proteinPer100: 12.6, carbsPer100: 0.7, fatPer100: 9.5, pieceLabel: "egg", pieceGrams: 50 },
  { slug: "rice-cooked", name: "White rice (cooked)", caloriesPer100: 130, proteinPer100: 2.7, carbsPer100: 28.2, fatPer100: 0.3 },
  { slug: "yogurt-plain", name: "Yogurt (plain)", caloriesPer100: 61, proteinPer100: 3.5, carbsPer100: 4.7, fatPer100: 3.3 },
  { slug: "greek-yogurt-low-fat", name: "Greek yogurt (low fat)", caloriesPer100: 59, proteinPer100: 10.3, carbsPer100: 3.6, fatPer100: 0.4 },
  { slug: "lean-meat-cooked", name: "Lean meat (cooked)", caloriesPer100: 165, proteinPer100: 31, carbsPer100: 0, fatPer100: 3.6 },
  { slug: "protein-powder", name: "Protein powder", caloriesPer100: 400, proteinPer100: 80, carbsPer100: 8, fatPer100: 5, pieceLabel: "scoop", pieceGrams: 30 },
  { slug: "oats-dry", name: "Oats (dry)", caloriesPer100: 379, proteinPer100: 13.2, carbsPer100: 67.7, fatPer100: 6.5 },
  { slug: "banana", name: "Banana", caloriesPer100: 89, proteinPer100: 1.1, carbsPer100: 22.8, fatPer100: 0.3, pieceLabel: "banana", pieceGrams: 118 },
  { slug: "blueberries", name: "Blueberries", caloriesPer100: 57, proteinPer100: 0.7, carbsPer100: 14.5, fatPer100: 0.3 },
  { slug: "peanut-butter", name: "Peanut butter", caloriesPer100: 588, proteinPer100: 25, carbsPer100: 20, fatPer100: 50 },
  { slug: "milk-semi-skimmed", name: "Milk (semi-skimmed)", caloriesPer100: 46, proteinPer100: 3.4, carbsPer100: 4.8, fatPer100: 1.5 },
  { slug: "water", name: "Water", caloriesPer100: 0, proteinPer100: 0, carbsPer100: 0, fatPer100: 0 },
];
