export type ProductUserStatus = "active" | "disabled" | "deleted";

/**
 * App connection credit enforcement mode.
 */
export type CreditMode = "disabled" | "track_only" | "enforce_if_present" | "enforce";
export type AppConnectionCreditMode = CreditMode;
export type OverrunPolicy = "limit_output" | "allow_overrun" | "carry_overrun_forward";

export type CapPeriod = "daily" | "monthly" | "lifetime";

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
  source?: "product_end_user" | "app_connection" | null;
  cap_rule_id?: string | null;
  amount?: string | null; // 12-decimal string
  currency?: string; // default "USD"
  period?: CapPeriod | string | null;
  spent_this_period?: string | null; // 12-decimal string
  period_start?: string | null;
  period_end?: string | null;
  reset_at?: string | null;
  status?: "active" | "disabled" | string | null;
  updated_at?: string | null;
}

export type ProductUserCap = ProductUserCapResponse;

export interface UsageBucket {
  product_user_charge_amount?: string;
  sell_cost: string; // 12-decimal string, e.g. "0.000045360000"
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  request_count: number;
  virtual_spend?: string;
  provider_cost?: string;
  uncovered_virtual_spend?: string;
}

export type ProductUserUsageMetrics = UsageBucket;

export interface ProductUserUsageSummary {
  this_period?: UsageBucket | null;
  this_month?: UsageBucket | null; // fallback alias for this_period
  period_start?: string | null; // ISO 8601 UTC
  period_end?: string | null; // ISO 8601 UTC
  total?: UsageBucket | null;
}

export interface ProductUserAllowanceAdjustment {
  type: "prorate_increase";
  configured_cap_amount: string;
  effective_at: string;
}

export interface ProductUserAllowanceResponse {
  remaining_credit_units?: string | null;
  adjustment?: ProductUserAllowanceAdjustment | null;
  app_connection_id?: string | null;
  cap_source?: "product_end_user" | "app_connection" | null;
  cap_rule_id?: string | null;
  credit_mode?: CreditMode | null;
  overrun_policy?: OverrunPolicy | null;
  currency?: string; // default "USD"
  period?: CapPeriod | string | null;
  period_start?: string | null;
  period_end?: string | null;
  cap_amount?: string | null; // 12-decimal string
  spent_this_period?: string | null; // 12-decimal string
  remaining_base_allowance?: string | null; // 12-decimal string
  available_credits?: string | null; // 12-decimal string
  available_allowance?: string | null; // 12-decimal string
}

export type ProductUserAllowance = ProductUserAllowanceResponse;

export interface ProductUserCreditSummaryResponse {
  remaining_credit_units?: string | null;
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

export type CreditSummary = ProductUserCreditSummaryResponse;

export interface ProductUserData {
  product_end_user_id?: string | null;
  id?: string | null;
  org_id?: string | null;
  app_id: string;
  external_user_id: string;
  display_name?: string | null;
  email?: string | null;
  email_hash?: string | null;
  status?: "active" | "disabled" | "deleted" | string | null;
  metadata?: Record<string, unknown> | null;
  allowance_starts_at?: string | null;
  last_app_connection_id?: string | null;

  usage?: ProductUserUsageSummary | null;
  cap?: ProductUserCapResponse | null; // active effective cap (from user or key)
  direct_cap?: ProductUserCapResponse | null; // user-specific cap, even if disabled
  credits?: CreditSummary | null;
  credit_summary?: CreditSummary | null;
  allowance?: ProductUserAllowanceResponse | null;

  created_at?: string | null;
  updated_at?: string | null;
}

export class ProductUserResponse implements ProductUserData {
  product_end_user_id?: string | null;
  id?: string | null;
  org_id?: string | null;
  app_id!: string;
  external_user_id!: string;
  display_name?: string | null;
  email?: string | null;
  email_hash?: string | null;
  status?: "active" | "disabled" | "deleted" | string | null;
  metadata?: Record<string, unknown> | null;
  allowance_starts_at?: string | null;
  last_app_connection_id?: string | null;

  usage?: ProductUserUsageSummary | null;
  cap?: ProductUserCapResponse | null;
  direct_cap?: ProductUserCapResponse | null;
  credits?: CreditSummary | null;
  credit_summary?: CreditSummary | null;
  allowance?: ProductUserAllowanceResponse | null;

  created_at?: string | null;
  updated_at?: string | null;

  constructor(data?: Partial<ProductUserData>) {
    if (!data) return;
    Object.assign(this, data);

    if (this.usage) {
      if (!this.usage.this_period && this.usage.this_month) {
        this.usage.this_period = { ...this.usage.this_month };
      }
      if (!this.usage.this_month && this.usage.this_period) {
        this.usage.this_month = { ...this.usage.this_period };
      }
    }

    if (!this.credit_summary && this.credits) {
      this.credit_summary = this.credits;
    } else if (!this.credits && this.credit_summary) {
      this.credits = this.credit_summary;
    }
  }

  static from(data?: Partial<ProductUserData> | ProductUserResponse): ProductUserResponse {
    if (data instanceof ProductUserResponse) {
      return data;
    }
    return new ProductUserResponse(data);
  }

  getAvailableAllowance(): string {
    if (this.allowance?.available_allowance != null && this.allowance.available_allowance !== "") {
      return this.allowance.available_allowance;
    }

    const credits = this.credits?.available_credits ?? this.credit_summary?.available_credits;
    if (credits != null && credits !== "") {
      return credits;
    }

    return "0.000000000000";
  }

  getTotalAvailableToSpend(): string {
    return this.getAvailableAllowance();
  }

  getAvailableCredits(): string {
    const credits = this.credits?.available_credits ?? this.credit_summary?.available_credits;
    if (credits != null && credits !== "") {
      return credits;
    }

    if (this.allowance?.available_credits != null && this.allowance.available_credits !== "") {
      return this.allowance.available_credits;
    }

    return "0.000000000000";
  }

  getTotalCredits(): string {
    return this.getAvailableCredits();
  }

  getTotalAllowance(): string | null {
    if (this.allowance?.cap_amount != null && this.allowance.cap_amount !== "") {
      return this.allowance.cap_amount;
    }

    if (this.cap?.amount != null && this.cap.amount !== "") {
      return this.cap.amount;
    }

    return null;
  }

  getCapSpent(): string {
    if (this.allowance?.spent_this_period != null && this.allowance.spent_this_period !== "") {
      return this.allowance.spent_this_period;
    }

    if (this.cap?.spent_this_period != null && this.cap.spent_this_period !== "") {
      return this.cap.spent_this_period;
    }

    return "0.000000000000";
  }

  getRemainingBaseAllowance(): string | null {
    if (this.allowance?.remaining_base_allowance != null && this.allowance.remaining_base_allowance !== "") {
      return this.allowance.remaining_base_allowance;
    }

    return null;
  }

  getUsageCost(period: "this_period" | "this_month" | "total" = "this_period"): string {
    if (period === "total") {
      return this.usage?.total?.sell_cost || "0.000000000000";
    }

    return (
      this.usage?.this_period?.sell_cost ||
      this.usage?.this_month?.sell_cost ||
      "0.000000000000"
    );
  }

  hasAvailableAllowance(): boolean {
    return parseFloat(this.getAvailableAllowance()) > 0;
  }

  get totalAvailableAllowance(): string {
    return this.getAvailableAllowance();
  }

  get totalAvailableToSpend(): string {
    return this.getTotalAvailableToSpend();
  }

  get totalCredits(): string {
    return this.getTotalCredits();
  }

  get capSpent(): string {
    return this.getCapSpent();
  }
}

export type ProductUser = ProductUserResponse;
export const ProductUser = ProductUserResponse;

export interface UpsertProductUserResponse {
  product_user: ProductUserResponse;
  created: boolean;
}

export interface ProductUserListResponse {
  product_users: ProductUserResponse[];
}

export interface UpsertProductUserParams {
  orgId?: string;
  appId: string;
  allowanceStartsAt?: string | null;
  externalUserId: string;
  displayName?: string | null;
  email?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface GetProductUserByExternalIdParams {
  inferenceKey?: string;
  keyAlias?: string;
  upsertIfMissing?: boolean;
  appId: string;
  externalUserId: string;
  orgId?: string;
}

export interface GetProductUserCreditSummaryByExternalIdParams {
  upsertIfMissing?: boolean;
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
  credit_units_per_usd?: string | null;
  remaining_credit_units?: string | null;
  credit_grant_id: string;
  external_reference?: string | null;
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
  creditUnitsPerUsd?: string | null;
  externalReference?: string;
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
  upsertIfMissing?: boolean;
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

export interface ProductUserAllowanceDebtSummaryResponse {
  outstanding_amount: string;
  repaid_by_credits_total: string;
  repaid_by_base_total: string;
  currency: string;
  oldest_debt_at: string | null;
}

export interface GetCreditGrantByExternalReferenceParams {
  appId: string;
  externalUserId: string;
  externalReference: string;
  orgId?: string;
}
