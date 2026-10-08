import type Anthropic from "@anthropic-ai/sdk";

export const FOOD_SYSTEM_PROMPT = `You estimate the nutrition of a meal from a photo for a fitness tracking app.

Rules:
- List each distinct food or drink you can see as a separate item (for example chicken, rice, avocado), not the whole plate as one item.
- Estimate the weight in grams of each item as served (cooked weight for cooked foods). Use visible cues: plate and cutlery size, thickness, packaging.
- Give calories (kcal), protein, carbs and fat in grams for that portion. The calories must be consistent with the macros (about 4 kcal per gram of protein or carbs, 9 per gram of fat).
- Give each item a confidence from 0 to 1. Use a low value when the portion is hard to judge, ingredients are hidden (sauces, oils, fillings) or the food is unclear. Do not be overconfident: photo-based estimates are rough.
- Mention hidden or uncertain things (oil, sauce, drinks out of frame) briefly in notes.
- If the image contains no food, set isFood to false and return an empty foods list.
- Report only through the report_meal tool. Do not give medical or dietary advice.`;

export const FOOD_TOOL: Anthropic.Tool = {
  name: "report_meal",
  description: "Report the foods identified in the photo with estimated portions and nutrition.",
  input_schema: {
    type: "object",
    properties: {
      isFood: { type: "boolean", description: "False when the photo does not show food or drink." },
      foods: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Short name, e.g. 'Grilled chicken breast'." },
            estimatedGrams: { type: "number", description: "Estimated served weight in grams." },
            calories: { type: "number", description: "kcal for this portion." },
            protein: { type: "number", description: "Grams of protein for this portion." },
            carbs: { type: "number", description: "Grams of carbohydrate for this portion." },
            fat: { type: "number", description: "Grams of fat for this portion." },
            confidence: { type: "number", description: "0 (guess) to 1 (certain)." },
          },
          required: ["name", "estimatedGrams", "calories", "protein", "carbs", "fat", "confidence"],
        },
      },
      confidence: { type: "string", enum: ["high", "medium", "low"], description: "Overall confidence in the whole estimate." },
      notes: { type: "string", description: "Short note on uncertainty or hidden ingredients." },
    },
    required: ["isFood", "foods", "confidence"],
  },
};
