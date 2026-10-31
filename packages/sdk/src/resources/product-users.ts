import type { ListProductUserActivityByExternalIdParams, ProductUserActivityResponse } from "../types/product-user-activity";
import type { HTTPTransport } from "../http/transport";
import { assertDecimalString } from "../utils/decimal";
import type { RequestOptions } from "../types/client";
import {
  ProductUserResponse,
  type UpsertProductUserParams,
  type UpsertProductUserResponse,
  type GetProductUserByExternalIdParams,
  type GetProductUserCreditSummaryByExternalIdParams,
  type ProductUserCreditSummaryResponse,
  type GrantCreditByExternalIdParams,
  type GetCreditGrantByExternalReferenceParams,
  type ProductUserCreditGrantResponse,
  type GrantProductUserCreditsResponse,
  type ProductUserCreditGrantListResponse,
  type ListCreditGrantsByExternalIdParams,
  type ProductUserAllowanceDebtSummaryResponse
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
      app_id: params.appId,
      external_user_id: params.externalUserId,
      display_name: params.displayName ?? null,
      email: params.email ?? null,
      metadata: params.metadata ?? null,
      ...(params.allowanceStartsAt !== undefined ? { allowance_starts_at: params.allowanceStartsAt } : {})
    };

    const query = params.orgId ? { org_id: params.orgId } : undefined;

    const res = await this.transport.request<UpsertProductUserResponse>("/product-users/by-external-id", {
      method: "PUT",
      body: payload,
      query,
      ...options
    });

    return {
      ...res,
      product_user: new ProductUserResponse(res.product_user)
    };
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

    const readOptions = this.productUserReadOptions(params.upsertIfMissing, options);
    const inferenceOptions = this.withHeader("X-Zorveus-Inference-Key", params.inferenceKey, readOptions);
    const selectedOptions = this.withHeader("X-Zorveus-Key-Alias", params.keyAlias, inferenceOptions);
    const data = await this.transport.request<ProductUserResponse>("/product-users/by-external-id", {
      method: "GET",
      query,
      ...selectedOptions,
    });

    return new ProductUserResponse(data);
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
        ...this.productUserReadOptions(params.upsertIfMissing, options)
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
      ...(params.externalReference !== undefined ? { external_reference: params.externalReference } : {}),
      ...(params.creditUnitsPerUsd !== undefined ? {
        credit_units_per_usd: params.creditUnitsPerUsd === null
          ? null
          : assertDecimalString(params.creditUnitsPerUsd, "grantCreditByExternalId.creditUnitsPerUsd"),
      } : {}),
      currency: params.currency || "USD",
      ...(params.source !== undefined ? { source: params.source } : {}),
      reason: params.reason ?? null,
      expires_at: params.expiresAt ?? null,
      metadata: params.metadata ?? null
    };

    const query = params.orgId ? { org_id: params.orgId } : undefined;

    const res = await this.transport.request<GrantProductUserCreditsResponse>(
      "/product-users/by-external-id/credit-grants",
      {
        method: "POST",
        body: payload,
        query,
        ...options
      }
    );

    return {
      ...res,
      product_user: new ProductUserResponse(res.product_user)
    };
  }

  async getCreditGrantByExternalReference(
    params: GetCreditGrantByExternalReferenceParams,
    options: RequestOptions = {}
  ): Promise<ProductUserCreditGrantResponse> {
    return this.transport.request<ProductUserCreditGrantResponse>(
      "/product-users/by-external-id/credit-grants/by-reference",
      {
        method: "GET",
        query: {
          app_id: params.appId,
          external_user_id: params.externalUserId,
          external_reference: params.externalReference,
          ...(params.orgId ? { org_id: params.orgId } : {})
        },
        ...options
      }
    );
  }

  async listActivityByExternalId(
    params: ListProductUserActivityByExternalIdParams,
    options: RequestOptions = {}
  ): Promise<ProductUserActivityResponse> {
    return this.transport.request<ProductUserActivityResponse>("/product-users/by-external-id/activity", {
      method: "GET",
      query: {
        app_id: params.appId,
        external_user_id: params.externalUserId,
        type: params.type,
        from: params.from,
        to: params.to,
        currency: params.currency,
        cursor: params.cursor,
        limit: params.limit,
      },
      ...this.productUserReadOptions(params.upsertIfMissing, options),
    });
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
        ...this.productUserReadOptions(params.upsertIfMissing, options)
      }
    );
  }
  async getAllowanceDebtByExternalId(
    params: GetProductUserCreditSummaryByExternalIdParams,
    options: RequestOptions = {}
  ): Promise<ProductUserAllowanceDebtSummaryResponse> {
    return this.transport.request<ProductUserAllowanceDebtSummaryResponse>(
      "/product-users/by-external-id/allowance-debt",
      {
        method: "GET",
        query: { app_id: params.appId, external_user_id: params.externalUserId, currency: params.currency },
        ...this.productUserReadOptions(params.upsertIfMissing, options)
      }
    );
  }

  private productUserReadOptions(upsertIfMissing: boolean | undefined, options: RequestOptions): RequestOptions {
    if (upsertIfMissing === undefined) return options;
    if (typeof upsertIfMissing !== "boolean") throw new TypeError("upsertIfMissing must be a boolean");
    return this.withHeader("X-Zorveus-Upsert-Product-User", upsertIfMissing ? "true" : "false", options);
  }

  private withHeader(name: string, value: string | undefined, options: RequestOptions): RequestOptions {
    if (value === undefined) return options;
    const headerName = Object.keys(this.transport.defaultHeaders).find(
      candidate => candidate.toLowerCase() === name.toLowerCase()
    ) ?? name;
    return {
      ...options,
      headers: {
        ...Object.fromEntries(Object.entries(options.headers ?? {}).filter(
          ([candidate]) => candidate.toLowerCase() !== name.toLowerCase()
        )),
        [headerName]: value,
      },
    };
  }

}
