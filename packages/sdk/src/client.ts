import { HTTPTransport } from "./http/transport";
import { Chat } from "./resources/chat/index";
import { Embeddings } from "./resources/embeddings";
import { Models } from "./resources/models";
import type {
  ZorveusInferenceClientOptions,
  RequestOptions,
  InferenceKeyUsageResponse
} from "./types/client";

/**
 * Zorveus Inference Client (Gateway Data Plane).
 * Authenticated via Inference Key (`zrv_...`) or API Key issued via OAuth (`access_token`).
 */
export class ZorveusInferenceClient {
  readonly chat: Chat;
  readonly embeddings: Embeddings;
  readonly models: Models;
  protected readonly transport: HTTPTransport;

  constructor(options: ZorveusInferenceClientOptions) {
    if (!options || !options.apiKey) {
      throw new Error(
        "ZorveusInferenceClient requires an 'apiKey' (Inference Key or OAuth Access Token)."
      );
    }

    const baseURL = options.baseURL
      ? options.baseURL.replace(/\/+$/, "")
      : options.gatewayBaseURL
        ? options.gatewayBaseURL.replace(/\/v1\/?$/, "").replace(/\/+$/, "")
        : "https://api.zorveus.com";

    const gatewayBaseURL = (options.gatewayBaseURL || `${baseURL}/v1`).replace(/\/+$/, "");

    this.transport = new HTTPTransport({
      apiKey: options.apiKey,
      baseURL,
      gatewayBaseURL,
      timeout: options.timeout,
      maxRetries: options.maxRetries,
      defaultHeaders: options.defaultHeaders,
      fetch: options.fetch
    });

    this.chat = new Chat(this.transport);
    this.embeddings = new Embeddings(this.transport);
    this.models = new Models(this.transport);
  }

  /**
   * Retrieves live spend, budget cap, and balance for the active inference key (`GET /inference-keys/usage`).
   */
  async getUsage(options: RequestOptions = {}): Promise<InferenceKeyUsageResponse> {
    return this.transport.request<InferenceKeyUsageResponse>("/inference-keys/usage", {
      method: "GET",
      ...options
    });
  }
}

/**
 * Primary Zorveus client class for gateway inference.
 */
export class Zorveus extends ZorveusInferenceClient {}
