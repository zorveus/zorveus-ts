import type { HTTPTransport } from "../http/transport";
import type { RequestOptions } from "../types/client";
import type { Model, ModelListParams, ModelListResponse } from "../types/models";

export class Models {
  private readonly transport: HTTPTransport;

  constructor(transport: HTTPTransport) {
    this.transport = transport;
  }

  /**
   * Lists available models on the Zorveus gateway.
   */
  async list(
    params: ModelListParams = {},
    options: RequestOptions = {}
  ): Promise<ModelListResponse> {
    const query: Record<string, unknown> = {};
    if (params.routeStatus) {
      query.route_status = params.routeStatus;
    }

    return this.transport.request<ModelListResponse>("/models", {
      method: "GET",
      query,
      isGateway: true,
      ...options
    });
  }

  /**
   * Retrieves information about a specific model.
   */
  async retrieve(
    modelId: string,
    options: RequestOptions = {}
  ): Promise<Model> {
    return this.transport.request<Model>(`/models/${encodeURIComponent(modelId)}`, {
      method: "GET",
      isGateway: true,
      ...options
    });
  }
}
