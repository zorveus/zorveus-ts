import type { HTTPTransport } from "../http/transport";
import { assertDecimalString } from "../utils/decimal";
import type { RequestOptions } from "../types/client";
import type {
  UpsertProductUserParams,
  UpsertProductUserResponse,
  ProductUserResponse,
  ProductUserListResponse,
  ProductUserListParams,
  GetProductUserByExternalIdParams,
  GetProductUserCreditSummaryByExternalIdParams,
  ProductUserCreditSummaryResponse,
  GrantCreditParams,
  GrantProductUserCreditsResponse,
  ProductUserCreditGrantListResponse,
  ListCreditGrantsParams,
  RevokeProductUserCreditGrantResponse
} from "../types/product-users";

export class ProductUsers {
  private readonly transport: HTTPTransport;

  constructor(transport: HTTPTransport) {
    this.transport = transport;
  }

  /**
   * Upserts a product user by external user ID (`PUT /product-users/by-external-id`).
   */
  async createOrUpdate(
    params: UpsertProductUserParams,
    options: RequestOptions = {}
  ): Promise<UpsertProductUserResponse> {
    const payload = {
      external_user_id: params.externalUserId,
      display_name: params.displayName ?? null,
      email: params.email ?? null,
      metadata: params.metadata ?? null
    };

    const query = params.orgId ? { org_id: params.orgId } : undefined;

    return this.transport.request<UpsertProductUserResponse>("/product-users/by-external-id", {
      method: "PUT",
      body: payload,
      query,
      ...options
    });
  }

  /**
   * Retrieves a single product end-user by ID (`GET /product-users/{product_end_user_id}`).
   */
  async get(
    productEndUserId: string,
    options: RequestOptions = {}
  ): Promise<ProductUserResponse> {
    return this.transport.request<ProductUserResponse>(
      `/product-users/${encodeURIComponent(productEndUserId)}`,
      {
        method: "GET",
        ...options
      }
    );
  }

  /**
   * Retrieves a product user profile by external ID (`GET /product-users/by-external-id`).
   * Returns complete profile with usage, active cap, and live credits.
   */
  async getByExternalId(
    params: GetProductUserByExternalIdParams,
    options: RequestOptions = {}
  ): Promise<ProductUserResponse> {
    const query: Record<string, unknown> = {
      app_id: params.appId,
      external_user_id: params.externalUserId
    };

    if (params.orgId) {
      query.org_id = params.orgId;
    }

    return this.transport.request<ProductUserResponse>("/product-users/by-external-id", {
      method: "GET",
      query,
      ...options
    });
  }

  /**
   * Retrieves a product user's live credit summary by external ID (`GET /product-users/by-external-id/credit-summary`).
   */
  async getCreditSummaryByExternalId(
    params: GetProductUserCreditSummaryByExternalIdParams,
    options: RequestOptions = {}
  ): Promise<ProductUserCreditSummaryResponse> {
    const query: Record<string, unknown> = {
      app_id: params.appId,
      external_user_id: params.externalUserId
    };

    if (params.currency) {
      query.currency = params.currency;
    }

    if (params.orgId) {
      query.org_id = params.orgId;
    }

    return this.transport.request<ProductUserCreditSummaryResponse>(
      "/product-users/by-external-id/credit-summary",
      {
        method: "GET",
        query,
        ...options
      }
    );
  }

  /**
   * Lists product end-users for an organization (`GET /product-users`).
   */
  async list(
    params: ProductUserListParams = {},
    options: RequestOptions = {}
  ): Promise<ProductUserListResponse> {
    const query: Record<string, unknown> = {};
    if (params.orgId) query.org_id = params.orgId;
    if (params.limit !== undefined) query.limit = params.limit;
    if (params.offset !== undefined) query.offset = params.offset;

    return this.transport.request<ProductUserListResponse>("/product-users", {
      method: "GET",
      query,
      ...options
    });
  }

  /**
   * Grants startup-funded AI credits to a product user (`POST /product-users/{id}/credit-grants`).
   * Validates amount as a strict financial decimal string.
   */
  async grantCredit(
    productEndUserId: string,
    params: GrantCreditParams,
    options: RequestOptions = {}
  ): Promise<GrantProductUserCreditsResponse> {
    assertDecimalString(params.amount, "grantCredit.amount");

    const payload = {
      app_id: params.appId,
      amount: params.amount,
      currency: params.currency || "USD",
      reason: params.reason ?? null,
      expires_at: params.expiresAt ?? null,
      metadata: params.metadata ?? null
    };

    const query = params.orgId ? { org_id: params.orgId } : undefined;

    return this.transport.request<GrantProductUserCreditsResponse>(
      `/product-users/${encodeURIComponent(productEndUserId)}/credit-grants`,
      {
        method: "POST",
        body: payload,
        query,
        ...options
      }
    );
  }

  /**
   * Lists credit grants for a product user (`GET /product-users/{id}/credit-grants`).
   */
  async listCreditGrants(
    productEndUserId: string,
    params: ListCreditGrantsParams = {},
    options: RequestOptions = {}
  ): Promise<ProductUserCreditGrantListResponse> {
    const query: Record<string, unknown> = {};
    if (params.orgId) query.org_id = params.orgId;
    if (params.limit !== undefined) query.limit = params.limit;
    if (params.offset !== undefined) query.offset = params.offset;

    return this.transport.request<ProductUserCreditGrantListResponse>(
      `/product-users/${encodeURIComponent(productEndUserId)}/credit-grants`,
      {
        method: "GET",
        query,
        ...options
      }
    );
  }

  /**
   * Revokes an active credit grant (`POST /product-users/{id}/credit-grants/{grantId}/revoke`).
   */
  async revokeCredit(
    productEndUserId: string,
    creditGrantId: string,
    options: RequestOptions = {}
  ): Promise<RevokeProductUserCreditGrantResponse> {
    return this.transport.request<RevokeProductUserCreditGrantResponse>(
      `/product-users/${encodeURIComponent(productEndUserId)}/credit-grants/${encodeURIComponent(creditGrantId)}/revoke`,
      {
        method: "POST",
        ...options
      }
    );
  }
}
