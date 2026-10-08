export type ErrorCode =
  | "unauthenticated"
  | "validation"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "internal";

/** Expected, user-presentable failure raised by the service layer. */
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}
