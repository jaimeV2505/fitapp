import Anthropic from "@anthropic-ai/sdk";
import { FOOD_SYSTEM_PROMPT, FOOD_TOOL } from "./prompt";
import type { AIProvider, FoodImageInput } from "./provider";

/** Claude vision. Runs on the server only: the API key never reaches the browser. */
export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";
  private readonly client: Anthropic;

  constructor(
    apiKey: string,
    readonly model: string,
  ) {
    this.client = new Anthropic({ apiKey, timeout: 45_000, maxRetries: 1 });
  }

  async analyzeFoodImage(input: FoodImageInput): Promise<unknown> {
    const hint = input.hint?.trim();
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1500,
      system: FOOD_SYSTEM_PROMPT,
      tools: [FOOD_TOOL],
      // Force structured output through the tool, so there is no free text to parse.
      tool_choice: { type: "tool", name: FOOD_TOOL.name },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: input.mimeType, data: Buffer.from(input.image).toString("base64") },
            },
            {
              type: "text",
              text: hint ? `Estimate this meal. The user says: "${hint.slice(0, 200)}"` : "Estimate this meal.",
            },
          ],
        },
      ],
    });

    const block = response.content.find((part) => part.type === "tool_use");
    if (!block || block.type !== "tool_use") throw new Error("The model did not return a structured estimate.");
    return block.input;
  }
}
