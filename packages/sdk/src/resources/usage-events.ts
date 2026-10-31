import type { HTTPTransport } from "../http/transport";
import { ZorveusError } from "../errors/zorveus-error";
import type { RequestOptions } from "../types/client";
import type { UsageEventListParams, UsageEventListResponse } from "../types/usage-events";

export class UsageEvents {
  constructor(_transport: HTTPTransport) {}

  async list(
    _params: UsageEventListParams = {},
    _options: RequestOptions = {}
  ): Promise<UsageEventListResponse> {
    throw new ZorveusError(
      "Organization usage events require a dashboard session. Use inference getUsage() or productUsers.getByExternalId() with application credentials.",
      { code: "zorveus_dashboard_session_required" }
    );
  }
}
