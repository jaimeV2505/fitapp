import { formatMessage, type MessageParams } from "@/lib/i18n/format";

export type ErrorCode =
  | "unauthenticated"
  | "validation"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "internal";

/**
 * Expected, user-presentable failure raised by the service layer. The message is an English template
 * (optionally with {placeholders} filled from `params`); the user sees its translation (see lib/i18n/errors.ts).
 */
export class AppError extends Error {
  readonly template: string;

  constructor(
    public readonly code: ErrorCode,
    template: string,
    public readonly params: MessageParams = {},
  ) {
    super(formatMessage(template, params));
    this.template = template;
  }
}
