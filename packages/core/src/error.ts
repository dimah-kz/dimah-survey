import { APIError as BetterCallAPIError } from "better-call/error";

type NamedStatus = ConstructorParameters<typeof BetterCallAPIError>[0];
type APIErrorStatus = NamedStatus | number;
type APIErrorBody = ConstructorParameters<typeof BetterCallAPIError>[1] & {
  params?: Record<string, string | number>;
  cause?: unknown;
};

export class APIError extends BetterCallAPIError {
  constructor(
    status: APIErrorStatus = "BAD_REQUEST",
    body?: APIErrorBody,
    headers?: HeadersInit,
  ) {
    const { cause, ...rest } = body ?? {};
    super(
      status as NamedStatus,
      Object.keys(rest).length > 0 ? rest : undefined,
      headers,
    );
    this.name = "APIError";
    if (cause !== undefined) {
      this.cause = cause;
    }
  }

  get code(): string | undefined {
    return this.body?.code;
  }

  static from(
    status: APIErrorStatus,
    error: { code: string; message: string },
  ): APIError {
    return new APIError(status, {
      message: error.message,
      code: error.code,
    });
  }
}

export function isAPIError(error: unknown): error is APIError {
  return (
    error instanceof BetterCallAPIError ||
    error instanceof APIError ||
    (error as { name?: string } | null)?.name === "APIError"
  );
}
