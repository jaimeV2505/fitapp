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
    const image = Buffer.from(input.image).toString("base64");

    // Structured output comes through the report_meal tool. The request does NOT force the tool (tool_choice
    // "tool" or "any"): some models reject it with a 400. The prompt asks for the tool and, if the model answers
    // in plain text anyway, one more attempt reminds it.
    for (const attempt of [1, 2]) {
      const instruction = attempt === 1 ? "Estimate this meal." : `Estimate this meal. Respond only by calling the ${FOOD_TOOL.name} tool.`;
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 3000,
        system: FOOD_SYSTEM_PROMPT,
        tools: [FOOD_TOOL],
        tool_choice: { type: "auto" },
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: input.mimeType, data: image } },
              { type: "text", text: hint ? `${instruction} The user says: "${hint.slice(0, 200)}"` : instruction },
            ],
          },
        ],
      });

      const block = response.content.find((part) => part.type === "tool_use");
      if (block && block.type === "tool_use") return block.input;
    }
    throw new Error("The model did not return a structured estimate.");
  }
}
