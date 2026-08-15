import type { HTTPTransport } from "../http/transport";
import type { RequestOptions } from "../types/client";
import { formatGatewayMetadata, type EmbeddingCreateParams, type EmbeddingCreateResponse } from "../types";

export class Embeddings {
  private readonly transport: HTTPTransport;

  constructor(transport: HTTPTransport) {
    this.transport = transport;
  }

  /**
   * Creates an embedding vector representing the input text.
   */
  async create(
    params: EmbeddingCreateParams,
    options: RequestOptions = {}
  ): Promise<EmbeddingCreateResponse> {
    const { zorveusMetadata, ...requestBody } = params;

    const gatewayMetadata = formatGatewayMetadata(zorveusMetadata);
    const payload = {
      ...requestBody,
      ...(gatewayMetadata ? { metadata: gatewayMetadata } : {})
    };

    return this.transport.request<EmbeddingCreateResponse>("/embeddings", {
      method: "POST",
      body: payload,
      isGateway: true,
      ...options
    });
  }
}
