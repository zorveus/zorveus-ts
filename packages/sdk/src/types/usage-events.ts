/** Values are open-ended so newer API enum values do not break older clients. */
export type CacheUsageBreakdownStatus =
  | "reported"
  | "not_reported"
  | "invalid"
  | (string & {});

export type CacheServiceTier = "standard" | "flex" | "priority" | (string & {});

export type CachePricingFallbackReason =
  | "invalid_token_breakdown"
  | "cache_read_price_missing"
  | "cache_creation_price_missing"
  | "cache_duration_unsupported"
  | "cached_audio_breakdown_unavailable"
  | "service_tier_unavailable"
  | (string & {});

export type UsageBillingMode = "wallet" | "byok_external" | (string & {});
export type UsageEventStatus =
  | "succeeded"
  | "partially_settled"
  | "failed"
  | (string & {});

export interface UsageEvent {
  usage_event_id: string;
  zorveus_request_id: string;
  app_id: string | null;
  app_connection_id: string | null;
  product_end_user_id: string | null;
  external_user_id: string | null;
  member_user_id: string | null;
  org_member_id: string | null;
  org_id: string;
  model: string;
  provider: string | null;
  provider_model: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  cache_read_input_tokens: number;
  cache_creation_input_tokens: number;
  cache_creation_1h_input_tokens: number;
  cache_usage_breakdown_status: CacheUsageBreakdownStatus;
  pricing_service_tier: CacheServiceTier | null;
  cache_pricing_fallback_reason: CachePricingFallbackReason | null;
  cache_savings: string;
  provider_cost: string;
  sell_cost: string;
  virtual_spend: string;
  uncovered_virtual_spend: string;
  unfunded_wallet_charge: string;
  usage_cost: string;
  billing_mode: UsageBillingMode;
  status: UsageEventStatus;
  overrun_policy?: string | null;
  overrun_reason?: string | null;
  requested_max_output_tokens?: number | null;
  applied_max_output_tokens?: number | null;
  provider_credential_id?: string | null;
  provider_credential_version_id?: string | null;
  reservation_id?: string | null;
  latency_ms?: number | null;
  created_at: string;
  [key: string]: unknown;
}

export interface UsageEventListParams {
  orgId?: string;
  appId?: string;
  appConnectionId?: string;
  productEndUserId?: string;
  model?: string;
  provider?: string;
  billingMode?: UsageBillingMode;
  status?: UsageEventStatus;
  createdAfter?: string;
  createdBefore?: string;
  limit?: number;
  cursor?: string;
}

export interface UsageEventListResponse {
  events: UsageEvent[];
  next_cursor: string | null;
  has_more: boolean;
  limit: number;
}

export function normalInputTokens(event: UsageEvent): number | null {
  if (event.cache_usage_breakdown_status !== "reported" || event.input_tokens === null) {
    return null;
  }

  return Math.max(
    0,
    event.input_tokens -
      event.cache_read_input_tokens -
      event.cache_creation_input_tokens -
      event.cache_creation_1h_input_tokens
  );
}
