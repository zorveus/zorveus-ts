import { buildHeaders } from "./headers";
import { APIConnectionError, createAPIError } from "../errors/zorveus-error";
import type { RequestOptions } from "../types/client";

export interface HttpRequestOptions extends RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
  body?: unknown;
  query?: Record<string, unknown>;
  isGateway?: boolean;
  stream?: boolean;
}

export class HTTPTransport {
  readonly apiKey: string;
  readonly baseURL: string;
  readonly gatewayBaseURL: string;
  readonly timeout: number;
  readonly maxRetries: number;
  readonly defaultHeaders: Record<string, string>;
  readonly fetchFn: typeof globalThis.fetch;

  constructor(options: {
    apiKey: string;
    baseURL?: string;
    gatewayBaseURL?: string;
    timeout?: number;
    maxRetries?: number;
    defaultHeaders?: Record<string, string>;
    fetch?: typeof globalThis.fetch;
  }) {
    if (!options || !options.apiKey) {
      throw new Error("HTTPTransport initialized without an apiKey.");
    }

    this.apiKey = options.apiKey;
    this.baseURL = (options.baseURL || "https://api.zorveus.com").replace(/\/+$/, "");
    this.gatewayBaseURL = (options.gatewayBaseURL || `${this.baseURL}/v1`).replace(/\/+$/, "");
    this.timeout = options.timeout ?? 60000;
    this.maxRetries = options.maxRetries ?? 2;
    this.defaultHeaders = options.defaultHeaders || {};
    this.fetchFn = options.fetch || globalThis.fetch.bind(globalThis);
  }

  /**
   * Executes an HTTP request with timeout, strict idempotency-aware retries, and error mapping.
   */
  async request<T>(path: string, options: HttpRequestOptions = {}): Promise<T> {
    const method = options.method || "GET";
    const isGateway = options.isGateway ?? false;
    const rootUrl = isGateway ? this.gatewayBaseURL : this.baseURL;
    const url = this.buildUrl(rootUrl, path, options.query);

    const isJsonBody = options.body !== undefined && !(options.body instanceof FormData);
    const contentType = isJsonBody ? "application/json" : undefined;

    const customHeaders = { ...options.headers };
    if (options.idempotencyKey) {
      customHeaders["X-Idempotency-Key"] = options.idempotencyKey;
    }

    const headers = buildHeaders({
      apiKey: this.apiKey,
      defaultHeaders: this.defaultHeaders,
      customHeaders,
      contentType
    });

    const isSafeMethod = method === "GET" || method === "HEAD" || method === "OPTIONS";
    const isIdempotent = isSafeMethod || Boolean(options.isIdempotent || options.idempotencyKey);

    const maxRetries = isIdempotent ? (options.maxRetries ?? this.maxRetries) : 0;
    const timeoutMs = options.timeout ?? this.timeout;

    let attempt = 0;

    while (true) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      if (options.signal) {
        options.signal.addEventListener("abort", () => controller.abort(), { once: true });
      }

      try {
        const bodyContent = isJsonBody ? JSON.stringify(options.body) : (options.body as BodyInit | undefined);

        const response = await this.fetchFn(url.toString(), {
          method,
          headers,
          body: bodyContent,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (options.stream) {
          if (!response.ok) {
            const errorBody = await this.parseResponseBody(response);
            throw createAPIError(response.status, errorBody, this.extractHeaders(response.headers));
          }

          if (!response.body) {
            throw new APIConnectionError("Streaming response body is null");
          }

          return response.body as unknown as T;
        }

        if (!response.ok) {
          const errorBody = await this.parseResponseBody(response);
          const shouldRetry = isIdempotent && this.shouldRetryStatus(response.status) && attempt < maxRetries;

          if (shouldRetry) {
            attempt++;
            const delay = this.calculateRetryDelay(attempt, response.headers.get("retry-after"));
            await this.sleep(delay);
            continue;
          }

          throw createAPIError(response.status, errorBody, this.extractHeaders(response.headers));
        }

        if (response.status === 204) {
          return undefined as unknown as T;
        }

        const data = await this.parseResponseBody(response);
        return data as T;
      } catch (error) {
        clearTimeout(timeoutId);

        if (error && typeof error === "object" && "status" in error) {
          throw error;
        }

        const isAbortError = error instanceof Error && error.name === "AbortError";
        const wasUserAborted = options.signal?.aborted;

        if (isAbortError && wasUserAborted) {
          throw new APIConnectionError("Request was cancelled by user", { cause: error });
        }

        const isTimeout = isAbortError && !wasUserAborted;
        const errorMessage = isTimeout ? `Request timed out after ${timeoutMs}ms` : "Network request failed";

        if (isIdempotent && attempt < maxRetries) {
          attempt++;
          const delay = this.calculateRetryDelay(attempt);
          await this.sleep(delay);
          continue;
        }

        throw new APIConnectionError(errorMessage, { cause: error });
      }
    }
  }

  private buildUrl(base: string, path: string, query?: Record<string, unknown>): URL {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(`${base}${normalizedPath}`);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null) {
          continue;
        }

        if (Array.isArray(value)) {
          for (const item of value) {
            if (item !== undefined && item !== null) {
              url.searchParams.append(key, String(item));
            }
          }
        } else {
          url.searchParams.append(key, String(value));
        }
      }
    }

    return url;
  }

  private async parseResponseBody(response: Response): Promise<unknown> {
    const text = await response.text();
    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  private extractHeaders(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  private shouldRetryStatus(status: number): boolean {
    return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
  }

  private calculateRetryDelay(attempt: number, retryAfterHeader?: string | null): number {
    if (retryAfterHeader) {
      const parsedSeconds = parseInt(retryAfterHeader, 10);
      if (!isNaN(parsedSeconds) && parsedSeconds > 0) {
        return parsedSeconds * 1000;
      }
    }

    const baseDelay = 500;
    const exponential = Math.min(10000, baseDelay * Math.pow(2, attempt));
    return Math.floor(Math.random() * exponential);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
