import type { HTTPTransport } from "../http/transport";
import type { RequestOptions } from "../types/client";
import type { UsageEventListParams, UsageEventListResponse } from "../types/usage-events";

export class UsageEvents {
  constructor(private readonly transport: HTTPTransport) {}

  /** Lists immutable usage events with cursor pagination. */
  async list(
    params: UsageEventListParams = {},
    options: RequestOptions = {}
  ): Promise<UsageEventListResponse> {
    return this.transport.request<UsageEventListResponse>("/dashboard-api/usage/events", {
      method: "GET",
      query: {
        org_id: params.orgId,
        app_id: params.appId,
        app_connection_id: params.appConnectionId,
        product_end_user_id: params.productEndUserId,
        model: params.model,
        provider: params.provider,
        billing_mode: params.billingMode,
        status: params.status,
        created_after: params.createdAfter,
        created_before: params.createdBefore,
        limit: params.limit,
        cursor: params.cursor
      },
      ...options
    });
  }
}
