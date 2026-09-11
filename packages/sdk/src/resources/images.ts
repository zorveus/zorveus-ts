import type { HTTPTransport } from "../http/transport";
import type { RequestOptions } from "../types/client";
import { formatGatewayMetadata } from "../types/chat";
import type { ImageGenerateParams, ImagesResponse } from "../types/images";

export class Images {
  private readonly transport: HTTPTransport;

  constructor(transport: HTTPTransport) {
    this.transport = transport;
  }

  /**
   * Generates images given a prompt (`POST /images/generations`).
   */
  async generate(
    params: ImageGenerateParams,
    options: RequestOptions = {}
  ): Promise<ImagesResponse> {
    const { zorveusMetadata, metadata: explicitMetadata, ...requestBody } = params;

    const gatewayMetadata = formatGatewayMetadata(zorveusMetadata);
    const combinedMetadata = explicitMetadata
      ? { ...gatewayMetadata, ...explicitMetadata }
      : gatewayMetadata;

    const payload = {
      ...requestBody,
      ...(combinedMetadata ? { metadata: combinedMetadata } : {})
    };

    return this.transport.request<ImagesResponse>("/images/generations", {
      method: "POST",
      body: payload,
      isGateway: true,
      ...options
    });
  }
}
