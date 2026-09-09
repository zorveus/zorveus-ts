export type ProductUserStatus = "active" | "suspended";

/**
 * App connection credit enforcement mode.
 */
export type CreditMode = "disabled" | "track_only" | "enforce_if_present" | "enforce";
export type AppConnectionCreditMode = CreditMode;

/**
 * Error parameters returned by the gateway when an enforced allowance is insufficient.
 */
export interface ProductUserAllowanceInsufficientParams {
  cap_rule_id: string;
  cap_period: "daily" | "weekly" | "monthly" | "lifetime" | string;
  currency: string;
  cap_amount: string; // 12-decimal string
  settled_spend_this_period: string; // 12-decimal string
  active_reservations_amount: string; // 12-decimal string
  remaining_base_allowance: string; // 12-decimal string
  promotional_credit_balance: string; // 12-decimal string
  available_allowance: string; // 12-decimal string
  estimated_request_cost: string; // 12-decimal string
  shortfall: string; // 12-decimal string
  [key: string]: unknown;
}

export interface ProductUserCapResponse {
  source: string;
  cap_rule_id: string;
  amount: string; // Decimal string
  currency: string;
  period: "daily" | "weekly" | "monthly" | "lifetime" | string;
  spent_this_period: string; // Decimal string
  reset_at: string | null;
  status: string;
  updated_at: string;
}

export interface ProductUserUsageMetrics {
  sell_cost: string; // Decimal string
  /** Reference-priced usage consumed against caps and credits. */
  virtual_spend?: string;
  /** Upstream provider cost, when the caller may view it. */
  provider_cost?: string;
  /** Usage beyond available allowance in track-only or overrun cases. */
  uncovered_virtual_spend?: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  request_count: number;
}

export interface ProductUserUsageSummary {
  this_month: ProductUserUsageMetrics;
  total: ProductUserUsageMetrics;
}

export interface ProductUserCreditSummaryResponse {
  currency: string;
  available_credits: string; // Decimal string
  active_grant_count: number;
  expiring_soon_amount: string; // Decimal string
  spent_this_month: string; // Decimal string
  spent_total: string; // Decimal string
  last_grant_at?: string | null;
  last_used_at?: string | null;
  product_end_user_id?: string;
  total_granted?: string;
  total_remaining?: string;
  active_grants_count?: number;
}

export interface ProductUserResponse {
  product_end_user_id: string;
  org_id: string;
  app_id: string;
  external_user_id: string;
  display_name: string | null;
  email_hash: string | null;
  status: ProductUserStatus;
  metadata: Record<string, unknown> | null;
  usage?: ProductUserUsageSummary | Record<string, unknown>;
  cap?: ProductUserCapResponse | null;
  credits?: ProductUserCreditSummaryResponse | null;
}

export type ProductUser = ProductUserResponse;

export interface UpsertProductUserResponse {
  product_user: ProductUserResponse;
  created: boolean;
}

export interface ProductUserListResponse {
  product_users: ProductUserResponse[];
}

export interface UpsertProductUserParams {
  orgId?: string;
  appId?: string;
  externalUserId: string;
  displayName?: string | null;
  email?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface GetProductUserByExternalIdParams {
  appId: string;
  externalUserId: string;
  orgId?: string;
}

export interface GetProductUserCreditSummaryByExternalIdParams {
  appId: string;
  externalUserId: string;
  currency?: string;
  orgId?: string;
}

export type CreditGrantStatus = "active" | "exhausted" | "expired" | "revoked";

export type CreditGrantSource =
  | "admin_adjustment"
  | "service_key"
  | "purchase"
  | "promotion"
  | "monthly_allowance"
  | "support_credit"
  | "import"
  | (string & {});

export interface ProductUserCreditGrantResponse {
  credit_grant_id: string;
  org_id: string;
  app_id: string;
  product_end_user_id: string;
  amount: string; // Decimal string
  remaining_amount: string; // Decimal string
  currency: string;
  source: string;
  reason: string | null;
  status: CreditGrantStatus;
  expires_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export type CreditGrant = ProductUserCreditGrantResponse;

export interface GrantProductUserCreditsResponse {
  product_user: ProductUserResponse;
  credit_grant: ProductUserCreditGrantResponse;
  credit_summary: ProductUserCreditSummaryResponse;
}

export interface ProductUserCreditGrantListResponse {
  credit_grants: ProductUserCreditGrantResponse[];
}

export interface RevokeProductUserCreditGrantResponse {
  credit_grant: ProductUserCreditGrantResponse;
  credit_summary: ProductUserCreditSummaryResponse;
  revoked: boolean;
}

export interface GrantCreditParams {
  orgId?: string;
  appId?: string;
  amount: string; // Decimal string
  currency?: string;
  reason?: string | null;
  expiresAt?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface GrantCreditByExternalIdParams {
  appId: string;
  externalUserId: string;
  amount: string; // Decimal string
  displayName?: string | null;
  email?: string | null;
  currency?: string;
  source?: CreditGrantSource;
  reason?: string | null;
  expiresAt?: string | null;
  metadata?: Record<string, unknown> | null;
  orgId?: string;
}

export interface ListCreditGrantsParams {
  appId?: string;
  orgId?: string;
  limit?: number;
  offset?: number;
}

export interface ListCreditGrantsByExternalIdParams {
  appId: string;
  externalUserId: string;
  status?: CreditGrantStatus;
  source?: CreditGrantSource;
  limit?: number;
  orgId?: string;
}

export interface ProductUserListParams {
  orgId?: string;
  appId?: string;
  limit?: number;
  offset?: number;
}
