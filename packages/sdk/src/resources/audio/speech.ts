import type { HTTPTransport } from "../../http/transport";
import type { RequestOptions } from "../../types/client";
import { formatGatewayMetadata } from "../../types/chat";
import type { AudioSpeechCreateParams } from "../../types/audio";

export interface SpeechResource {
  (params: AudioSpeechCreateParams, options?: RequestOptions): Promise<Response>;
  create(params: AudioSpeechCreateParams, options?: RequestOptions): Promise<Response>;
}

export class Speech {
  private readonly transport: HTTPTransport;

  constructor(transport: HTTPTransport) {
    this.transport = transport;
  }

  /**
   * Generates audio from input text (`POST /audio/speech`).
   * Returns a standard Fetch Response containing binary audio data.
   */
  async create(
    params: AudioSpeechCreateParams,
    options: RequestOptions = {}
  ): Promise<Response> {
    const { zorveusMetadata, metadata: explicitMetadata, ...requestBody } = params;

    const gatewayMetadata = formatGatewayMetadata(zorveusMetadata);
    const combinedMetadata = explicitMetadata
      ? { ...gatewayMetadata, ...explicitMetadata }
      : gatewayMetadata;

    const payload = {
      ...requestBody,
      ...(combinedMetadata ? { metadata: combinedMetadata } : {})
    };

    return this.transport.request<Response>("/audio/speech", {
      method: "POST",
      body: payload,
      isGateway: true,
      rawResponse: true,
      ...options
    });
  }
}
