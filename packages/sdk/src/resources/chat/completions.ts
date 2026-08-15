import type { HTTPTransport } from "../../http/transport";
import { parseSSEStream } from "../../http/sse";
import type { RequestOptions } from "../../types/client";
import {
  formatGatewayMetadata,
  type ChatCompletion,
  type ChatCompletionChunk,
  type ChatCompletionCreateParams,
  type ChatCompletionCreateParamsNonStreaming,
  type ChatCompletionCreateParamsStreaming
} from "../../types/chat";

export class Completions {
  private readonly transport: HTTPTransport;

  constructor(transport: HTTPTransport) {
    this.transport = transport;
  }

  /**
   * Creates a model response for the given chat conversation.
   * Supports standard single-response and Server-Sent Events (SSE) streaming modes.
   */
  async create(
    params: ChatCompletionCreateParamsStreaming,
    options?: RequestOptions
  ): Promise<AsyncIterableIterator<ChatCompletionChunk>>;
  async create(
    params: ChatCompletionCreateParamsNonStreaming,
    options?: RequestOptions
  ): Promise<ChatCompletion>;
  async create(
    params: ChatCompletionCreateParams,
    options?: RequestOptions
  ): Promise<ChatCompletion | AsyncIterableIterator<ChatCompletionChunk>>;
  async create(
    params: ChatCompletionCreateParams,
    options: RequestOptions = {}
  ): Promise<ChatCompletion | AsyncIterableIterator<ChatCompletionChunk>> {
    const isStreaming = Boolean(params.stream);
    const { zorveusMetadata, metadata: explicitMetadata, ...requestBody } = params;

    // Build the request body metadata payload expected by Zorveus Gateway
    const gatewayMetadata = formatGatewayMetadata(zorveusMetadata);
    const combinedMetadata = explicitMetadata
      ? { ...gatewayMetadata, ...explicitMetadata }
      : gatewayMetadata;

    const payload = {
      ...requestBody,
      ...(combinedMetadata ? { metadata: combinedMetadata } : {})
    };

    if (isStreaming) {
      const responseStream = await this.transport.request<ReadableStream<Uint8Array>>(
        "/chat/completions",
        {
          method: "POST",
          body: { ...payload, stream: true },
          isGateway: true,
          stream: true,
          ...options
        }
      );

      return parseSSEStream(responseStream);
    }

    return this.transport.request<ChatCompletion>("/chat/completions", {
      method: "POST",
      body: payload,
      isGateway: true,
      stream: false,
      ...options
    });
  }
}
