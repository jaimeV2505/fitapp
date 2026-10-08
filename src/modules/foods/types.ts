export interface FoodView {
  id: string;
  name: string;
  brand: string | null;
  caloriesPer100: number;
  proteinPer100: number;
  carbsPer100: number;
  fatPer100: number;
  pieceLabel: string | null;
  pieceGrams: number | null;
  /** Built-in foods are shared; editing one creates your own copy. */
  isBuiltIn: boolean;
  nutritionSource: string;
}
