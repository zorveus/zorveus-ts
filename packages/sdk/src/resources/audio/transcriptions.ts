import type { HTTPTransport } from "../../http/transport";
import type { RequestOptions } from "../../types/client";
import { formatGatewayMetadata } from "../../types/chat";
import type { AudioTranscriptionCreateParams, AudioTranscription } from "../../types/audio";

export class Transcriptions {
  private readonly transport: HTTPTransport;

  constructor(transport: HTTPTransport) {
    this.transport = transport;
  }

  /**
   * Transcribes audio into the input language (`POST /audio/transcriptions`).
   */
  async create(
    params: AudioTranscriptionCreateParams,
    options: RequestOptions = {}
  ): Promise<AudioTranscription> {
    const formData = new FormData();
    formData.append("file", params.file);
    formData.append("model", params.model);

    if (params.language) {
      formData.append("language", params.language);
    }
    if (params.prompt) {
      formData.append("prompt", params.prompt);
    }
    if (params.response_format) {
      formData.append("response_format", params.response_format);
    }
    if (params.temperature !== undefined) {
      formData.append("temperature", String(params.temperature));
    }
    if (params.timestamp_granularities) {
      for (const gran of params.timestamp_granularities) {
        formData.append("timestamp_granularities[]", gran);
      }
    }

    const gatewayMetadata = formatGatewayMetadata(params.zorveusMetadata);
    const combinedMetadata = params.metadata
      ? { ...gatewayMetadata, ...params.metadata }
      : gatewayMetadata;

    if (combinedMetadata && Object.keys(combinedMetadata).length > 0) {
      formData.append("metadata", JSON.stringify(combinedMetadata));
    }

    return this.transport.request<AudioTranscription>("/audio/transcriptions", {
      method: "POST",
      body: formData,
      isGateway: true,
      ...options
    });
  }
}
