export interface ZorveusInferenceClientOptions {
  /**
   * API Key used for gateway inference.
   * Accepts an Inference Key (`zrv_...`) or an API Key issued via OAuth code exchange (`access_token`).
   */
  apiKey: string;

  /**
   * Base URL for the Zorveus API Control Plane.
   * @default "https://api.zorveus.com"
   */
  baseURL?: string;

  /**
   * Base URL for the Zorveus Inference Gateway (Data Plane).
   * @default "https://api.zorveus.com/v1"
   */
  gatewayBaseURL?: string;

  /**
   * Request timeout in milliseconds.
   * @default 60000 (60 seconds)
   */
  timeout?: number;

  /**
   * Maximum number of request retries on rate limits (429) or transient 5xx errors for idempotent operations.
   * @default 2
   */
  maxRetries?: number;

  /**
   * Default headers merged into every outgoing HTTP request.
   */
  defaultHeaders?: Record<string, string>;

  /**
   * Optional custom fetch implementation (defaults to globalThis.fetch).
   */
  fetch?: typeof globalThis.fetch;
}

export interface ZorveusServiceClientOptions {
  /**
   * Organization Service Key used for server-side management authentication (`zrv_service_...`).
   * WARNING: Never expose this key in browser client applications.
   */
  apiKey: string;

  /**
   * Base URL for the Zorveus Management Control Plane API.
   * @default "https://api.zorveus.com"
   */
  baseURL?: string;

  /**
   * Request timeout in milliseconds.
   * @default 60000 (60 seconds)
   */
  timeout?: number;

  /**
   * Maximum number of request retries for idempotent operations.
   * @default 2
   */
  maxRetries?: number;

  /**
   * Default headers merged into every outgoing HTTP request.
   */
  defaultHeaders?: Record<string, string>;

  /**
   * Optional custom fetch implementation.
   */
  fetch?: typeof globalThis.fetch;
}

export type ZorveusClientOptions = ZorveusInferenceClientOptions;

export interface RequestOptions {
  /**
   * Request timeout in milliseconds.
   */
  timeout?: number;

  /**
   * Custom headers for this specific request.
   */
  headers?: Record<string, string>;

  /**
   * Maximum retries for this specific request.
   */
  maxRetries?: number;

  /**
   * Explicitly mark non-GET request as idempotent to enable automatic retries.
   */
  isIdempotent?: boolean;

  /**
   * Optional Idempotency key header.
   */
  idempotencyKey?: string;

  /**
   * AbortSignal for external request cancellation.
   */
  signal?: AbortSignal;
}

export interface InferenceKeyUsageResponse {
  status: "active" | "inactive" | "suspended" | string;
  app_id: string | null;
  app_connection_id: string | null;
  currency: string;
  period: "daily" | "weekly" | "monthly" | "lifetime" | string;
  spend_cap: string | null; // Decimal string or null if uncapped
  spent_this_period: string; // Decimal string
  remaining_balance: string | null; // Decimal string or null if uncapped
  reset_at: string | null;
}
