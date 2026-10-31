import type { UsageMetadata } from "./usage-metadata";

export type ProductUserCreditActivityType =
  | "credit_added" | "credit_revoked" | "credit_expired" | "credit_refunded"
  | "credit_adjusted" | "allowance_debt_repayment";
export type ProductUserActivityType = "usage" | ProductUserCreditActivityType;

export interface ProductUserCreditAllocation {
  credit_grant_id: string;
  amount: string;
  currency: string;
  metadata: UsageMetadata | null;
}

export interface ProductUserUsageActivity {
  charged_credit_units?: string | null;
  id: string;
  type: "usage";
  label: string;
  amount: string;
  currency: string;
  status: string;
  created_at: string;
  model: string;
  usage_metadata: UsageMetadata | null;
  base_allowance_charge_amount: string | null;
  credit_charge_amount: string;
  uncovered_charge_amount: string | null;
  credit_allocations: ProductUserCreditAllocation[];
}

export interface ProductUserCreditActivity {
  id: string;
  type: ProductUserCreditActivityType;
  label: string;
  amount: string;
  currency: string;
  status: "completed";
  created_at: string;
  credit_grant_id: string | null;
  metadata: UsageMetadata | null;
}

export type ProductUserActivityItem = ProductUserUsageActivity | ProductUserCreditActivity;

export interface ProductUserActivityResponse {
  product_end_user_id: string;
  items: ProductUserActivityItem[];
  next_cursor: string | null;
  has_more: boolean;
  limit: number;
}

export interface ListProductUserActivityByExternalIdParams {
  upsertIfMissing?: boolean;
  appId: string;
  externalUserId: string;
  type?: ProductUserActivityType;
  from?: string;
  to?: string;
  currency?: string;
  cursor?: string;
  limit?: number;
}
