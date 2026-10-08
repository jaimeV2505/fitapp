/**
 * AI provider abstraction (Phase 2). The Anthropic adapter implements this interface
 * server-side; its output is always validated with Zod before it reaches the UI.
 */
export interface FoodImageInput {
  image: Uint8Array;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  /** Optional hint typed by the user, e.g. "chicken and rice, no sauce". */
  hint?: string;
}

export interface AIProvider {
  readonly name: string;
  /** Returns the raw (unvalidated) model output as parsed JSON. Validation happens in the service layer. */
  analyzeFoodImage(input: FoodImageInput): Promise<unknown>;
}
