import type { HTTPTransport } from "../http/transport";
import { assertDecimalString } from "../utils/decimal";
import type { RequestOptions } from "../types/client";
import type {
  UpsertProductUserParams,
  UpsertProductUserResponse,
  ProductUserResponse,
  GetProductUserByExternalIdParams,
  GetProductUserCreditSummaryByExternalIdParams,
  ProductUserCreditSummaryResponse,
  GrantCreditByExternalIdParams,
  GrantProductUserCreditsResponse,
  ProductUserCreditGrantListResponse,
  ListCreditGrantsByExternalIdParams
} from "../types/product-users";

export class ProductUsers {
  private readonly transport: HTTPTransport;

  constructor(transport: HTTPTransport) {
    this.transport = transport;
  }

  /**
   * Upserts a product user by external user ID (`PUT /product-users/by-external-id`).
   * Creates the user if they do not exist, or updates their profile if they do.
   */
  async createOrUpdate(
    params: UpsertProductUserParams,
    options: RequestOptions = {}
  ): Promise<UpsertProductUserResponse> {
    const payload = {
      ...(params.appId ? { app_id: params.appId } : {}),
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
   * Alias for `createOrUpdate` (`PUT /product-users/by-external-id`).
   */
  async upsert(
    params: UpsertProductUserParams,
    options: RequestOptions = {}
  ): Promise<UpsertProductUserResponse> {
    return this.createOrUpdate(params, options);
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
   * Grants credits to an end user by external ID (`POST /product-users/by-external-id/credit-grants`).
   * Automatically provisions the product user if they do not exist yet.
   */
  async grantCreditByExternalId(
    params: GrantCreditByExternalIdParams,
    options: RequestOptions = {}
  ): Promise<GrantProductUserCreditsResponse> {
    const amount = assertDecimalString(params.amount, "grantCreditByExternalId.amount");

    const payload = {
      app_id: params.appId,
      external_user_id: params.externalUserId,
      display_name: params.displayName ?? null,
      email: params.email ?? null,
      amount,
      currency: params.currency || "USD",
      source: params.source ?? null,
      reason: params.reason ?? null,
      expires_at: params.expiresAt ?? null,
      metadata: params.metadata ?? null
    };

    const query = params.orgId ? { org_id: params.orgId } : undefined;

    return this.transport.request<GrantProductUserCreditsResponse>(
      "/product-users/by-external-id/credit-grants",
      {
        method: "POST",
        body: payload,
        query,
        ...options
      }
    );
  }

  /**
   * Lists credit grants for a product user by external ID (`GET /product-users/by-external-id/credit-grants`).
   */
  async listCreditGrantsByExternalId(
    params: ListCreditGrantsByExternalIdParams,
    options: RequestOptions = {}
  ): Promise<ProductUserCreditGrantListResponse> {
    const query: Record<string, unknown> = {
      app_id: params.appId,
      external_user_id: params.externalUserId
    };

    if (params.status) query.status = params.status;
    if (params.source) query.source = params.source;
    if (params.limit !== undefined) query.limit = params.limit;
    if (params.orgId) query.org_id = params.orgId;

    return this.transport.request<ProductUserCreditGrantListResponse>(
      "/product-users/by-external-id/credit-grants",
      {
        method: "GET",
        query,
        ...options
      }
    );
  }
}
