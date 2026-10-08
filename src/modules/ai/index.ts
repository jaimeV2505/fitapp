import { env } from "@/lib/env";
import { AnthropicProvider } from "./anthropic-provider";
import type { AIProvider } from "./provider";

const globalForAi = globalThis as unknown as { __ai?: AIProvider };

/** The configured AI provider, or null when no API key is set. */
export function getAIProvider(): AIProvider | null {
  if (!env.ANTHROPIC_API_KEY) return null;
  globalForAi.__ai ??= new AnthropicProvider(env.ANTHROPIC_API_KEY, env.ANTHROPIC_MODEL);
  return globalForAi.__ai;
}

export function aiModelName(): string {
  return env.ANTHROPIC_MODEL;
}
