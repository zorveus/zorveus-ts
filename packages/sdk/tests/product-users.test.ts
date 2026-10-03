import { describe, it, expect, vi } from "vitest";
import { ZorveusServiceClient, ProductUserResponse, ProductUser } from "../src/index";

describe("Product Users Management", () => {
  it("upserts product user and returns UpsertProductUserResponse", async () => {
    const mockResponse = {
      product_user: {
        product_end_user_id: "usr_123",
        org_id: "org_456",
        app_id: "app_789",
        external_user_id: "ext_001",
        display_name: "Jane Doe",
        email_hash: "hash123",
        status: "active",
        metadata: { tier: "pro" },
        usage: { total_requests: 0 }
      },
      created: true
    };

    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    );

    const client = new ZorveusServiceClient({ apiKey: "zrv_service_key_123" });
    const res = await client.productUsers.createOrUpdate({
      externalUserId: "ext_001",
      displayName: "Jane Doe",
      email: "jane@example.com"
    });

    expect(res.created).toBe(true);
    expect(res.product_user.product_end_user_id).toBe("usr_123");
    expect(res.product_user.display_name).toBe("Jane Doe");
  });

  it("retrieves product user by external ID with cap, credits, and usage", async () => {
    const mockResponse = {
      product_end_user_id: "peu_01j6abc1234567890def",
      org_id: "org_startup_123",
      app_id: "app_support_123",
      external_user_id: "usr_alex_8842",
      display_name: "Alex Smith",
      email_hash: "sha256:5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
      status: "active",
      metadata: { plan: "pro", tier: "enterprise" },
      cap: {
        source: "product_end_user",
        cap_rule_id: "cap_01j6def456",
        amount: "50.000000000000",
        currency: "USD",
        period: "monthly",
        spent_this_period: "12.450000000000",
        reset_at: "2026-09-01T00:00:00Z",
        status: "active",
        updated_at: "2026-08-01T10:00:00Z"
      },
      credits: {
        currency: "USD",
        available_credits: "25.000000000000",
        active_grant_count: 2,
        expiring_soon_amount: "5.000000000000",
        spent_this_month: "10.000000000000",
        spent_total: "35.000000000000",
        last_grant_at: "2026-08-10T14:30:00Z",
        last_used_at: "2026-08-14T22:15:00Z"
      },
      usage: {
        this_month: {
          sell_cost: "12.450000000000",
          input_tokens: 154000,
          output_tokens: 32000,
          total_tokens: 186000,
          request_count: 48
        },
        total: {
          sell_cost: "45.800000000000",
          input_tokens: 620000,
          output_tokens: 115000,
          total_tokens: 735000,
          request_count: 192
        }
      }
    };

    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    );

    const client = new ZorveusServiceClient({ apiKey: "zrv_service_key_123" });
    const user = await client.productUsers.getByExternalId({
      appId: "app_support_123",
      externalUserId: "usr_alex_8842"
    });

    expect(user.product_end_user_id).toBe("peu_01j6abc1234567890def");
    expect(user.external_user_id).toBe("usr_alex_8842");
    expect(user.credits?.available_credits).toBe("25.000000000000");
    expect(user.cap?.amount).toBe("50.000000000000");
    expect(user.cap?.spent_this_period).toBe("12.450000000000");
  });

  it("retrieves credit summary by external ID", async () => {
    const mockSummary = {
      currency: "USD",
      available_credits: "25.000000000000",
      active_grant_count: 2,
      expiring_soon_amount: "5.000000000000",
      spent_this_month: "10.000000000000",
      spent_total: "35.000000000000",
      last_grant_at: "2026-08-10T14:30:00Z",
      last_used_at: "2026-08-14T22:15:00Z"
    };

    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockSummary), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    );

    const client = new ZorveusServiceClient({ apiKey: "zrv_service_key_123" });
    const summary = await client.productUsers.getCreditSummaryByExternalId({
      appId: "app_support_123",
      externalUserId: "usr_alex_8842",
      currency: "USD"
    });

    expect(summary.currency).toBe("USD");
    expect(summary.available_credits).toBe("25.000000000000");
    expect(summary.active_grant_count).toBe(2);
    expect(summary.spent_this_month).toBe("10.000000000000");
  });


  it("grants credits by external ID via POST /product-users/by-external-id/credit-grants", async () => {
    const mockResponse = {
      product_user: {
        product_end_user_id: "peu_9f595afb85a44217",
        org_id: "org_startup_123",
        app_id: "app_startup_123",
        external_user_id: "user-123",
        display_name: "Jane Doe",
        email_hash: null,
        status: "active",
        metadata: null,
        usage: {}
      },
      credit_grant: {
        credit_grant_id: "pucg_9f595afb85a44217",
        org_id: "org_startup_123",
        app_id: "app_startup_123",
        product_end_user_id: "peu_9f595afb85a44217",
        amount: "25.000000000000",
        remaining_amount: "25.000000000000",
        currency: "USD",
        source: "promotion",
        reason: "Upgrade promo bonus",
        status: "active",
        expires_at: "2026-12-31T23:59:59Z",
        metadata: { promo_code: "SUMMER2026" },
        created_at: "2026-08-15T12:00:00Z",
        updated_at: "2026-08-15T12:00:00Z"
      },
      credit_summary: {
        currency: "USD",
        active_grants_count: 1,
        total_granted_amount: "25.000000000000",
        remaining_balance: "25.000000000000",
        expiring_soon_amount: "25.000000000000",
        next_expiration_at: "2026-12-31T23:59:59Z"
      }
    };

    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    );

    const client = new ZorveusServiceClient({ apiKey: "zrv_service_key_123" });
    const res = await client.productUsers.grantCreditByExternalId({
      appId: "app_startup_123",
      externalUserId: "user-123",
      displayName: "Jane Doe",
      email: "jane@example.com",
      amount: "25.000000000000",
      source: "promotion",
      reason: "Upgrade promo bonus"
    });

    expect(res.credit_grant.credit_grant_id).toBe("pucg_9f595afb85a44217");
    expect(res.credit_grant.amount).toBe("25.000000000000");
    expect(res.credit_grant.source).toBe("promotion");
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.zorveus.com/product-users/by-external-id/credit-grants",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("lists credit grants by external ID via GET /product-users/by-external-id/credit-grants", async () => {
    const mockGrants = {
      credit_grants: [
        {
          credit_grant_id: "pucg_9f595afb85a44217",
          org_id: "org_startup_123",
          app_id: "app_startup_123",
          product_end_user_id: "peu_9f595afb85a44217",
          amount: "10.000000000000",
          remaining_amount: "8.500000000000",
          currency: "USD",
          source: "signup_bonus",
          reason: "Welcome credits",
          status: "active",
          expires_at: "2026-12-31T23:59:59Z",
          metadata: { campaign: "launch_2026" },
          created_at: "2026-08-15T12:00:00Z",
          updated_at: "2026-08-15T12:30:00Z"
        }
      ]
    };

    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockGrants), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    );

    const client = new ZorveusServiceClient({ apiKey: "zrv_service_key_123" });
    const res = await client.productUsers.listCreditGrantsByExternalId({
      appId: "app_startup_123",
      externalUserId: "user-123",
      status: "active"
    });

    expect(res.credit_grants).toHaveLength(1);
    expect(res.credit_grants[0].credit_grant_id).toBe("pucg_9f595afb85a44217");
    expect(res.credit_grants[0].source).toBe("signup_bonus");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/product-users/by-external-id/credit-grants?app_id=app_startup_123&external_user_id=user-123&status=active"),
      expect.objectContaining({ method: "GET" })
    );
  });

  it("throws InvalidDecimalError when amount is not a valid decimal string", async () => {
    const client = new ZorveusServiceClient({ apiKey: "zrv_service_key_123" });
    await expect(
      client.productUsers.grantCreditByExternalId({
        appId: "app_123",
        externalUserId: "usr_123",
        amount: "INVALID_50"
      })
    ).rejects.toThrow("must be a valid decimal string");
  });

  describe("ProductUserResponse financial helper getters", () => {
    it("computes financial getters accurately with a full allowance payload", () => {
      const user = new ProductUserResponse({
        app_id: "app_123",
        external_user_id: "usr_full",
        allowance: {
          app_connection_id: "conn_123",
          cap_source: "product_end_user",
          cap_rule_id: "rule_123",
          credit_mode: "enforce",
          overrun_policy: "limit_output",
          currency: "USD",
          period: "monthly",
          cap_amount: "100.000000000000",
          spent_this_period: "25.000000000000",
          remaining_base_allowance: "75.000000000000",
          available_credits: "15.000000000000",
          available_allowance: "90.000000000000"
        },
        cap: {
          source: "product_end_user",
          cap_rule_id: "rule_123",
          amount: "100.000000000000",
          currency: "USD",
          period: "monthly",
          spent_this_period: "25.000000000000"
        },
        credits: {
          currency: "USD",
          available_credits: "15.000000000000",
          active_grant_count: 1,
          expiring_soon_amount: "0.000000000000",
          spent_this_month: "5.000000000000",
          spent_total: "10.000000000000"
        },
        usage: {
          this_period: {
            sell_cost: "25.000000000000",
            input_tokens: 1000,
            output_tokens: 500,
            total_tokens: 1500,
            request_count: 10
          },
          total: {
            sell_cost: "50.000000000000",
            input_tokens: 2000,
            output_tokens: 1000,
            total_tokens: 3000,
            request_count: 20
          }
        }
      });

      expect(user.getAvailableAllowance()).toBe("90.000000000000");
      expect(user.getTotalAvailableToSpend()).toBe("90.000000000000");
      expect(user.totalAvailableAllowance).toBe("90.000000000000");
      expect(user.totalAvailableToSpend).toBe("90.000000000000");

      expect(user.getAvailableCredits()).toBe("15.000000000000");
      expect(user.getTotalCredits()).toBe("15.000000000000");
      expect(user.totalCredits).toBe("15.000000000000");

      expect(user.getTotalAllowance()).toBe("100.000000000000");
      expect(user.getCapSpent()).toBe("25.000000000000");
      expect(user.capSpent).toBe("25.000000000000");
      expect(user.getRemainingBaseAllowance()).toBe("75.000000000000");

      expect(user.getUsageCost("this_period")).toBe("25.000000000000");
      expect(user.getUsageCost("total")).toBe("50.000000000000");
      expect(user.hasAvailableAllowance()).toBe(true);
    });

    it("falls back to cap and credits when allowance is missing", () => {
      const user = new ProductUserResponse({
        app_id: "app_123",
        external_user_id: "usr_legacy",
        cap: {
          source: "app_connection",
          amount: "50.000000000000",
          spent_this_period: "10.000000000000"
        },
        credits: {
          currency: "USD",
          available_credits: "20.000000000000",
          active_grant_count: 1,
          expiring_soon_amount: "0.000000000000",
          spent_this_month: "0.000000000000",
          spent_total: "0.000000000000"
        }
      });

      expect(user.getAvailableAllowance()).toBe("20.000000000000");
      expect(user.getTotalAvailableToSpend()).toBe("20.000000000000");
      expect(user.getAvailableCredits()).toBe("20.000000000000");
      expect(user.getTotalCredits()).toBe("20.000000000000");
      expect(user.getTotalAllowance()).toBe("50.000000000000");
      expect(user.getCapSpent()).toBe("10.000000000000");
      expect(user.getRemainingBaseAllowance()).toBeNull();
      expect(user.hasAvailableAllowance()).toBe(true);
    });

    it("defaults correctly when all allowance and cap fields are missing", () => {
      const user = new ProductUserResponse({
        app_id: "app_123",
        external_user_id: "usr_empty"
      });

      expect(user.getAvailableAllowance()).toBe("0.000000000000");
      expect(user.getTotalAvailableToSpend()).toBe("0.000000000000");
      expect(user.getAvailableCredits()).toBe("0.000000000000");
      expect(user.getTotalCredits()).toBe("0.000000000000");
      expect(user.getTotalAllowance()).toBeNull();
      expect(user.getCapSpent()).toBe("0.000000000000");
      expect(user.getRemainingBaseAllowance()).toBeNull();
      expect(user.getUsageCost()).toBe("0.000000000000");
      expect(user.getUsageCost("total")).toBe("0.000000000000");
      expect(user.hasAvailableAllowance()).toBe(false);
    });

    it("ignores direct_cap when resolving active cap totals and spent amounts", () => {
      const user = new ProductUserResponse({
        app_id: "app_123",
        external_user_id: "usr_direct_only",
        direct_cap: {
          source: "product_end_user",
          amount: "100.000000000000",
          spent_this_period: "40.000000000000",
          status: "disabled"
        }
      });

      expect(user.getTotalAllowance()).toBeNull();
      expect(user.getCapSpent()).toBe("0.000000000000");
    });

    it("copies this_month to this_period when this_period is missing", () => {
      const user = new ProductUserResponse({
        app_id: "app_123",
        external_user_id: "usr_compat",
        usage: {
          this_month: {
            sell_cost: "12.340000000000",
            input_tokens: 100,
            output_tokens: 50,
            total_tokens: 150,
            request_count: 2
          }
        }
      });

      expect(user.usage?.this_period).toBeDefined();
      expect(user.usage?.this_period?.sell_cost).toBe("12.340000000000");
      expect(user.getUsageCost("this_period")).toBe("12.340000000000");
    });

    it("ProductUser.from wraps plain objects and hydrates methods", () => {
      const raw = {
        app_id: "app_123",
        external_user_id: "usr_plain",
        allowance: {
          available_allowance: "42.000000000000"
        }
      };

      const user = ProductUser.from(raw);
      expect(user).toBeInstanceOf(ProductUserResponse);
      expect(user.getAvailableAllowance()).toBe("42.000000000000");
      expect(user.hasAvailableAllowance()).toBe(true);

      const same = ProductUser.from(user);
      expect(same).toBe(user);
    });

    it("retrieves product user via getByExternalId and returns hydrated ProductUserResponse", async () => {
      const mockResponse = {
        product_end_user_id: "peu_001",
        app_id: "app_test",
        external_user_id: "usr_test",
        allowance: {
          cap_amount: "75.000000000000",
          spent_this_period: "15.000000000000",
          available_allowance: "60.000000000000"
        }
      };

      global.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      );

      const client = new ZorveusServiceClient({ apiKey: "zrv_service_key_123" });
      const user = await client.productUsers.getByExternalId({
        appId: "app_test",
        externalUserId: "usr_test"
      });

      expect(user).toBeInstanceOf(ProductUserResponse);
      expect(user.getAvailableAllowance()).toBe("60.000000000000");
      expect(user.getTotalAllowance()).toBe("75.000000000000");
      expect(user.getCapSpent()).toBe("15.000000000000");
      expect(user.hasAvailableAllowance()).toBe(true);
    });

    it("supports this_month in getUsageCost and synchronizes credits/credit_summary", () => {
      const user = new ProductUserResponse({
        app_id: "app_123",
        external_user_id: "usr_sync",
        credit_summary: {
          currency: "USD",
          available_credits: "30.000000000000",
          active_grant_count: 1,
          expiring_soon_amount: "0.000000000000",
          spent_this_month: "5.000000000000",
          spent_total: "5.000000000000"
        },
        usage: {
          this_period: {
            sell_cost: "8.500000000000",
            input_tokens: 10,
            output_tokens: 10,
            total_tokens: 20,
            request_count: 1
          }
        }
      });

      expect(user.credits).toBeDefined();
      expect(user.credits?.available_credits).toBe("30.000000000000");
      expect(user.getAvailableCredits()).toBe("30.000000000000");
      expect(user.getUsageCost("this_month")).toBe("8.500000000000");
    });

    it("does not expose dashboard routes on productUsers", () => {
      const client = new ZorveusServiceClient({ apiKey: "zrv_service_key_123" });
      const resource = client.productUsers as unknown as Record<string, unknown>;

      expect(resource.list).toBeUndefined();
      expect(resource.get).toBeUndefined();
    });
  });
});
