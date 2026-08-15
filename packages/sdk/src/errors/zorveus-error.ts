/**
 * Base class for all Zorveus SDK errors.
 */
export class ZorveusError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly param?: string;
  readonly type?: string;
  readonly headers?: Record<string, string>;
  readonly rawBody?: unknown;

  constructor(
    message: string,
    options: {
      status?: number;
      code?: string;
      param?: string;
      type?: string;
      headers?: Record<string, string>;
      rawBody?: unknown;
      cause?: unknown;
    } = {}
  ) {
    super(message);
    this.name = "ZorveusError";
    this.status = options.status;
    this.code = options.code;
    this.param = options.param;
    this.type = options.type;
    this.headers = options.headers;
    this.rawBody = options.rawBody;
    if (options.cause) {
      this.cause = options.cause;
    }

    // Restore prototype chain
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when an HTTP request fails before receiving a response (network drops, DNS failures, aborts/timeouts).
 */
export class APIConnectionError extends ZorveusError {
  constructor(message = "Connection to Zorveus API failed", options: { cause?: unknown } = {}) {
    super(message, options);
    this.name = "APIConnectionError";
    if (options.cause) {
      this.cause = options.cause;
    }
  }
}

/**
 * Base class for all HTTP 4xx and 5xx responses from the Zorveus API.
 */
export class APIStatusError extends ZorveusError {
  constructor(
    message: string,
    options: {
      status: number;
      code?: string;
      param?: string;
      type?: string;
      headers?: Record<string, string>;
      rawBody?: unknown;
    }
  ) {
    super(message, options);
    this.name = "APIStatusError";
  }
}

/**
 * HTTP 401: Invalid or expired API key, Service key, or OAuth access token.
 */
export class AuthenticationError extends APIStatusError {
  constructor(message = "Invalid or expired Zorveus credentials", options: Omit<ConstructorParameters<typeof APIStatusError>[1], "status"> & { status?: number } = {}) {
    super(message, { ...options, status: options.status ?? 401 });
    this.name = "AuthenticationError";
  }
}

/**
 * HTTP 403: Forbidden access, insufficient scope, or model not permitted.
 */
export class PermissionDeniedError extends APIStatusError {
  constructor(message = "Permission denied for this operation or model", options: Omit<ConstructorParameters<typeof APIStatusError>[1], "status"> & { status?: number } = {}) {
    super(message, { ...options, status: options.status ?? 403 });
    this.name = "PermissionDeniedError";
  }
}

/**
 * HTTP 404: Requested resource (app, user, credential, model) was not found.
 */
export class NotFoundError extends APIStatusError {
  constructor(message = "Resource not found", options: Omit<ConstructorParameters<typeof APIStatusError>[1], "status"> & { status?: number } = {}) {
    super(message, { ...options, status: options.status ?? 404 });
    this.name = "NotFoundError";
  }
}

/**
 * HTTP 422: Request schema validation failure.
 */
export class UnprocessableEntityError extends APIStatusError {
  constructor(message = "Request validation failed", options: Omit<ConstructorParameters<typeof APIStatusError>[1], "status"> & { status?: number } = {}) {
    super(message, { ...options, status: options.status ?? 422 });
    this.name = "UnprocessableEntityError";
  }
}

/**
 * HTTP 429: Rate limit exceeded or quota exhausted.
 */
export class RateLimitError extends APIStatusError {
  constructor(message = "Rate limit exceeded. Please retry after some time.", options: Omit<ConstructorParameters<typeof APIStatusError>[1], "status"> & { status?: number } = {}) {
    super(message, { ...options, status: options.status ?? 429 });
    this.name = "RateLimitError";
  }
}

/**
 * HTTP 500, 502, 503, 504: Zorveus internal server or upstream gateway error.
 */
export class InternalServerError extends APIStatusError {
  constructor(message = "Zorveus internal server error", options: Omit<ConstructorParameters<typeof APIStatusError>[1], "status"> & { status?: number } = {}) {
    super(message, { ...options, status: options.status ?? 500 });
    this.name = "InternalServerError";
  }
}

/**
 * Base class for Zorveus financial and business constraint errors.
 */
export class ZorveusBusinessError extends APIStatusError {
  constructor(
    message: string,
    options: {
      status: number;
      code?: string;
      param?: string;
      type?: string;
      headers?: Record<string, string>;
      rawBody?: unknown;
    }
  ) {
    super(message, options);
    this.name = "ZorveusBusinessError";
  }
}

/**
 * HTTP 402: Organization or product-user wallet balance is exhausted.
 */
export class InsufficientFundsError extends ZorveusBusinessError {
  constructor(message = "Wallet balance exhausted. Top up required.", options: Omit<ConstructorParameters<typeof ZorveusBusinessError>[1], "status"> & { status?: number } = {}) {
    super(message, { ...options, status: options.status ?? 402, code: options.code ?? "insufficient_funds" });
    this.name = "InsufficientFundsError";
  }
}

/**
 * HTTP 402/403: Monthly or daily spending cap reached for organization, app connection, or product user.
 */
export class CapExceededError extends ZorveusBusinessError {
  constructor(message = "Spending cap limit reached", options: Omit<ConstructorParameters<typeof ZorveusBusinessError>[1], "status"> & { status?: number } = {}) {
    super(message, { ...options, status: options.status ?? 402, code: options.code ?? "cap_exceeded" });
    this.name = "CapExceededError";
  }
}

/**
 * HTTP 403: Product user credit grant has expired.
 */
export class CreditGrantExpiredError extends ZorveusBusinessError {
  constructor(message = "Product user credit grant has expired", options: Omit<ConstructorParameters<typeof ZorveusBusinessError>[1], "status"> & { status?: number } = {}) {
    super(message, { ...options, status: options.status ?? 403, code: options.code ?? "credit_grant_expired" });
    this.name = "CreditGrantExpiredError";
  }
}

/**
 * Factory that parses HTTP status code and response payload into the most specific ZorveusError subclass.
 */
export function createAPIError(
  status: number,
  body: unknown,
  headers?: Record<string, string>
): APIStatusError {
  let message = `Request failed with status ${status}`;
  let code: string | undefined;
  let param: string | undefined;
  let type: string | undefined;

  // Normalize string error bodies (including single-quoted Python dict strings)
  let parsedBody: unknown = body;
  if (typeof body === "string") {
    try {
      parsedBody = JSON.parse(body);
    } catch {
      try {
        parsedBody = JSON.parse(body.replace(/'/g, '"'));
      } catch {
        const codeMatch = body.match(/['"]code['"]\s*:\s*['"]([^'"]+)['"]/);
        const msgMatch = body.match(/['"]message['"]\s*:\s*['"]([^'"]+)['"]/);
        if (msgMatch?.[1]) message = msgMatch[1];
        if (codeMatch?.[1]) code = codeMatch[1];
      }
    }
  }

  // Extract structured error details if available
  if (parsedBody && typeof parsedBody === "object") {
    const obj = parsedBody as Record<string, unknown>;

    if (obj.error && typeof obj.error === "object") {
      const err = obj.error as Record<string, unknown>;
      if (typeof err.message === "string") message = err.message;
      if (typeof err.code === "string") code = err.code;
      if (typeof err.param === "string") param = err.param;
      if (typeof err.type === "string") type = err.type;
    } else if (typeof obj.detail === "string") {
      message = obj.detail;
    } else if (Array.isArray(obj.detail) && obj.detail.length > 0) {
      const first = obj.detail[0];
      if (first && typeof first.msg === "string") {
        message = first.msg;
      }
    } else if (typeof obj.message === "string") {
      message = obj.message;
    }
  }

  const options = { status, code, param, type, headers, rawBody: body };

  // Check specific business error codes first
  const normalizedCode = (code || "").toLowerCase();
  if (
    normalizedCode.includes("cap_exceed") ||
    normalizedCode.includes("spend_cap") ||
    message.toLowerCase().includes("spending cap")
  ) {
    return new CapExceededError(message, options);
  }

  if (
    normalizedCode.includes("insufficient_funds") ||
    normalizedCode.includes("balance_exhausted") ||
    normalizedCode.includes("insufficient_balance") ||
    normalizedCode.includes("wallet_empty") ||
    message.toLowerCase().includes("insufficient funds") ||
    message.toLowerCase().includes("balance exhausted") ||
    message.toLowerCase().includes("wallet is empty")
  ) {
    return new InsufficientFundsError(message, options);
  }

  if (normalizedCode.includes("grant_expired")) {
    return new CreditGrantExpiredError(message, options);
  }

  // Check by HTTP status code
  if (status === 401) {
    return new AuthenticationError(message, options);
  }

  if (status === 402) {
    return new InsufficientFundsError(message, options);
  }

  if (status === 403) {
    return new PermissionDeniedError(message, options);
  }

  if (status === 404) {
    return new NotFoundError(message, options);
  }

  if (status === 422) {
    return new UnprocessableEntityError(message, options);
  }

  if (status === 429) {
    return new RateLimitError(message, options);
  }

  if (status >= 500) {
    return new InternalServerError(message, options);
  }

  return new APIStatusError(message, options);
}
