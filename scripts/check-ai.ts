/**
 * pnpm ai:check
 * Sends a tiny test image to the configured AI model and reports whether the whole path works (key, model, the
 * structured output). A blank image is not food, so the expected answer is "isFood: false"; what matters is that the
 * call succeeds. Run it after changing ANTHROPIC_API_KEY or ANTHROPIC_MODEL.
 */
import "dotenv/config";
import { AnthropicProvider } from "../src/modules/ai/anthropic-provider";
import { classifyAiError, statusOf } from "../src/modules/ai/domain/errors";

// A 1x1 PNG.
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

async function main(): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  const model = process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-5-5";
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY is not set.");
    process.exit(2);
  }
  console.log(`Model: ${model}`);
  const started = Date.now();
  try {
    const result = await new AnthropicProvider(apiKey, model).analyzeFoodImage({ image: new Uint8Array(PNG), mimeType: "image/png" });
    console.log(`OK in ${Date.now() - started} ms. Answer:`, JSON.stringify(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`FAILED (${classifyAiError({ status: statusOf(error), message })}): ${message}`);
    process.exit(1);
  }
}

void main();
