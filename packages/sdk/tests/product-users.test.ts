import { describe, it, expect, vi } from "vitest";
import { ZorveusServiceClient, ProductUserResponse, ProductUser, formatGatewayMetadata } from "../src/index";

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


it("uses the effective prorated allowance rather than the configured cap", () => {
  const user = new ProductUserResponse({
    app_id: "app_test", external_user_id: "customer_test", cap: { amount: "50.000000000000" },
    allowance: { cap_amount: "30.000000000000", available_allowance: "22.000000000000",
      adjustment: { type: "prorate_increase", configured_cap_amount: "50.000000000000", effective_at: "2026-06-16T00:00:00Z" } },
  });
  expect(user.getTotalAllowance()).toBe("30.000000000000");
  expect(user.getAvailableAllowance()).toBe("22.000000000000");
  expect(user.allowance?.adjustment?.configured_cap_amount).toBe(user.cap?.amount);
});


it("formats the proration instruction even without profile metadata", () => {
  expect(formatGatewayMetadata({ externalUserId: "customer_test", allowanceChange: "prorate_increase" })).toEqual({
    external_user_id: "customer_test",
    product_user: { allowance_change: "prorate_increase" },
  });
});


it.each([undefined, null, "2026-07-17T09:00:00Z"])("serializes the allowance anchor without clearing it on omission: %s", async (anchor) => {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
    created: false, product_user: { app_id: "app_test", external_user_id: "customer_test", allowance_starts_at: anchor }
  })));
  const service = new ZorveusServiceClient({ apiKey: "zrv_svc_test", fetch });
  const result = await service.productUsers.createOrUpdate({
    appId: "app_test", externalUserId: "customer_test", allowanceStartsAt: anchor
  });
  const payload = JSON.parse(fetch.mock.calls[0][1].body);
  expect(Object.hasOwn(payload, "allowance_starts_at")).toBe(anchor !== undefined);
  if (anchor !== undefined) expect(payload.allowance_starts_at).toBe(anchor);
  expect(result.product_user.external_user_id).toBe(payload.external_user_id);
});

it("omits an unspecified credit source so the backend can apply its default", async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
    product_user: { app_id: "app_test", external_user_id: "customer_test" },
    credit_grant: { credit_grant_id: "grant_test" }, credit_summary: { available_credits: "3.00" }
  }), { status: 201 }));
  const service = new ZorveusServiceClient({ apiKey: "zrv_svc_test", fetch });
  const result = await service.productUsers.grantCreditByExternalId({
    appId: "app_test", externalUserId: "customer_test", amount: "3.00"
  });
  const payload = JSON.parse(fetch.mock.calls[0][1].body);
  expect(payload).not.toHaveProperty("source");
  expect(payload.amount).toBe(result.credit_summary.available_credits);
});

it("retrieves carried allowance debt with the customer identity and currency", async () => {
  const debt = { outstanding_amount: "1.25", repaid_by_credits_total: "2.00", repaid_by_base_total: "3.00", currency: "USD", oldest_debt_at: null };
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(debt)));
  const service = new ZorveusServiceClient({ apiKey: "zrv_svc_test", fetch });
  expect(await service.productUsers.getAllowanceDebtByExternalId({
    appId: "app_test", externalUserId: "customer / test", currency: debt.currency
  })).toEqual(debt);
  const url = new URL(fetch.mock.calls[0][0]);
  expect(url.pathname).toBe("/product-users/by-external-id/allowance-debt");
  expect(url.searchParams.get("external_user_id")).toBe("customer / test");
  expect(url.searchParams.get("currency")).toBe(debt.currency);
});


it("fetches product-user activity with filters and preserves charges, grant rates, metadata, and pagination", async () => {
  const payload = {
  "product_end_user_id": "peu_123",
  "items": [
    {
      "id": "ue_123",
      "type": "usage",
      "label": "Agent replied",
      "amount": "-4.000000000000",
      "currency": "USD",
      "status": "succeeded",
      "created_at": "2026-10-26T12:00:00Z",
      "model": "test-model",
      "usage_metadata": {
        "activity_label": "Agent replied",
        "category": "support"
      },
      "base_allowance_charge_amount": "1.000000000000",
      "credit_charge_amount": "3.000000000000",
      "uncovered_charge_amount": "0.000000000000",
      "credit_allocations": [
        {
          "credit_grant_id": "grant_123",
          "amount": "3.000000000000",
          "currency": "USD",
          "metadata": {
            "credits_per_usd": "1500"
          }
        }
      ]
    },
    {
      "id": "entry_123",
      "type": "credit_added",
      "label": "Credit purchase",
      "amount": "10.000000000000",
      "currency": "USD",
      "status": "completed",
      "created_at": "2026-10-25T12:00:00Z",
      "credit_grant_id": "grant_123",
      "metadata": {
        "credits_per_usd": "1500"
      }
    }
  ],
  "next_cursor": "next_page",
  "has_more": true,
  "limit": 2
};
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(payload), { status: 200 }));
  const client = new ZorveusServiceClient({ apiKey: "zrv_svc_test", fetch });
  const result = await client.productUsers.listActivityByExternalId({
    appId: "app_123", externalUserId: "user_123", type: "usage",
    from: "2026-10-01T00:00:00Z", to: "2026-11-01T00:00:00Z",
    currency: "USD", cursor: "previous_page", limit: 2,
  }, { headers: { "X-Request-ID": "history_123" } });
  const [url, init] = fetch.mock.calls[0]!;
  expect(new URL(url).pathname).toBe("/product-users/by-external-id/activity");
  expect(Object.fromEntries(new URL(url).searchParams)).toEqual({
    app_id: "app_123", external_user_id: "user_123", type: "usage",
    from: "2026-10-01T00:00:00Z", to: "2026-11-01T00:00:00Z",
    currency: "USD", cursor: "previous_page", limit: "2",
  });
  expect(new Headers(init.headers).get("authorization")).toBe("Bearer zrv_svc_test");
  expect(new Headers(init.headers).get("x-request-id")).toBe("history_123");
  expect(result).toEqual(payload);
});

it("omits unspecified activity filters from the HTTP request", async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
    product_end_user_id: "peu_123", items: [], next_cursor: null, has_more: false, limit: 20,
  }), { status: 200 }));
  const client = new ZorveusServiceClient({ apiKey: "zrv_svc_test", fetch });
  const result = await client.productUsers.listActivityByExternalId({ appId: "app_123", externalUserId: "user_123" });
  expect(Object.fromEntries(new URL(fetch.mock.calls[0]![0]).searchParams)).toEqual({
    app_id: "app_123", external_user_id: "user_123",
  });
  expect(result.items).toEqual([]);
});


it.each([
  ["getByExternalId", "", { external_user_id: "user_123" }, "external_user_id", "user_123"],
  ["getCreditSummaryByExternalId", "/credit-summary", { available_credits: "0.000000000000" }, "available_credits", "0.000000000000"],
  ["getAllowanceDebtByExternalId", "/allowance-debt", { outstanding_amount: "0.000000000000" }, "outstanding_amount", "0.000000000000"],
  ["listCreditGrantsByExternalId", "/credit-grants", { credit_grants: [] }, "credit_grants", []],
  ["listActivityByExternalId", "/activity", { items: [] }, "items", []],
] as const)("%s only opts into product-user creation when the caller sends the header", async (method, suffix, payload, field, expected) => {
  const fetch = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ error: {
      code: "zorveus_product_user_not_found", message: "User not found",
    } }), { status: 404 }))
    .mockResolvedValueOnce(new Response(JSON.stringify(payload), { status: 200 }));
  const service = new ZorveusServiceClient({ apiKey: "zrv_svc_test", fetch });
  const params = { appId: "app_123", externalUserId: "user_123" };
  await expect(service.productUsers[method](params)).rejects.toMatchObject({
    status: 404, code: "zorveus_product_user_not_found",
  });
  const result = await service.productUsers[method](params, {
    headers: { "X-Zorveus-Upsert-Product-User": "true" },
  });
  expect(result).toHaveProperty(field, expected);
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(new URL(fetch.mock.calls[1]![0]).pathname).toBe("/product-users/by-external-id" + suffix);
  expect(new Headers(fetch.mock.calls[0]![1].headers).has("x-zorveus-upsert-product-user")).toBe(false);
  expect(new Headers(fetch.mock.calls[1]![1].headers).get("x-zorveus-upsert-product-user")).toBe("true");
  expect(new Headers(fetch.mock.calls[1]![1].headers).get("authorization")).toBe("Bearer zrv_svc_test");
});


const directUpsertReadCases = [
  ["getByExternalId", "", { external_user_id: "user_123" }, "external_user_id", "user_123"],
  ["getCreditSummaryByExternalId", "/credit-summary", { available_credits: "0.000000000000" }, "available_credits", "0.000000000000"],
  ["getAllowanceDebtByExternalId", "/allowance-debt", { outstanding_amount: "0.000000000000" }, "outstanding_amount", "0.000000000000"],
  ["listCreditGrantsByExternalId", "/credit-grants", { credit_grants: [] }, "credit_grants", []],
  ["listActivityByExternalId", "/activity", { items: [] }, "items", []],
] as const;

it.each(directUpsertReadCases)("%s supports the direct upsertIfMissing option without changing other request data", async (method, suffix, payload, field, expected) => {
  const fetch = vi.fn().mockImplementation(async () => new Response(JSON.stringify(payload), { status: 200 }));
  const service = new ZorveusServiceClient({ apiKey: "zrv_svc_test", fetch });
  for (const upsertIfMissing of [false, true]) {
    const headers = {
      "x-zorveus-upsert-product-user": upsertIfMissing ? "false" : "true", "X-Request-ID": "read_123",
    };
    const result = await service.productUsers[method]({
      appId: "app_123", externalUserId: "user_123", upsertIfMissing,
    }, { headers });
    const [url, init] = fetch.mock.calls.at(-1)!;
    const sentHeaders = new Headers(init.headers);
    expect(result).toHaveProperty(field, expected);
    expect(new URL(url).pathname).toBe("/product-users/by-external-id" + suffix);
    expect(new URL(url).searchParams.has("upsertIfMissing")).toBe(false);
    expect(init.body).toBeUndefined();
    expect(sentHeaders.get("x-zorveus-upsert-product-user")).toBe(upsertIfMissing ? "true" : "false");
    expect(sentHeaders.get("x-request-id")).toBe("read_123");
    expect(sentHeaders.get("authorization")).toBe("Bearer zrv_svc_test");
    expect(headers["x-zorveus-upsert-product-user"]).toBe(upsertIfMissing ? "false" : "true");
  }
});

it.each(["X-Zorveus-Upsert-Product-User", "x-zorveus-upsert-product-user"])("the direct option overrides a client default in %s", async headerName => {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ credit_grants: [] }), { status: 200 }));
  const service = new ZorveusServiceClient({
    apiKey: "zrv_svc_test", fetch, defaultHeaders: { [headerName]: "true" },
  });
  await service.productUsers.listCreditGrantsByExternalId({
    appId: "app_123", externalUserId: "user_123", upsertIfMissing: false,
  });
  expect(new Headers(fetch.mock.calls[0]![1].headers).get("x-zorveus-upsert-product-user")).toBe("false");
});

it("rejects a string upsertIfMissing value before sending a request", async () => {
  const fetch = vi.fn();
  const service = new ZorveusServiceClient({ apiKey: "zrv_svc_test", fetch });
  await expect(service.productUsers.getByExternalId({
    appId: "app_123", externalUserId: "user_123", upsertIfMissing: "false" as unknown as boolean,
  })).rejects.toThrow("upsertIfMissing must be a boolean");
  expect(fetch).not.toHaveBeenCalled();
});


const referencedCreditGrant = {
  credit_grant_id: "pucg_retry",
  external_reference: "purchase:payment/123?part=1",
  org_id: "org_retry", app_id: "app_retry", product_end_user_id: "peu_retry",
  amount: "5.000000000000", remaining_amount: "3.000000000000", currency: "USD",
  source: "purchase", reason: null, status: "active", expires_at: null, metadata: null,
  created_at: "2026-10-27T00:00:00Z", updated_at: "2026-10-27T00:00:00Z",
};

it("sends a durable grant reference and preserves it in the result", async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
    product_user: { external_user_id: "customer_retry" }, credit_grant: referencedCreditGrant,
    credit_summary: { available_credits: referencedCreditGrant.remaining_amount },
  }), { status: 201 }));
  const service = new ZorveusServiceClient({ apiKey: "zrv_svc_retry", fetch });
  const result = await service.productUsers.grantCreditByExternalId({
    appId: "app_retry", externalUserId: "customer_retry", amount: "5.000000000000",
    source: "purchase", externalReference: referencedCreditGrant.external_reference,
  });
  expect(JSON.parse(fetch.mock.calls[0]![1].body)).toEqual({
    app_id: "app_retry", external_user_id: "customer_retry", amount: "5.000000000000", currency: "USD",
    source: "purchase", external_reference: referencedCreditGrant.external_reference,
    display_name: null, email: null, reason: null, expires_at: null, metadata: null,
  });
  expect(result.credit_grant).toEqual(referencedCreditGrant);
});

it("retrieves one grant by reference with the customer and app scope", async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(referencedCreditGrant), { status: 200 }));
  const service = new ZorveusServiceClient({ apiKey: "zrv_svc_retry", fetch });
  const grant = await service.productUsers.getCreditGrantByExternalReference({
    appId: "app_retry", externalUserId: "customer_retry", externalReference: referencedCreditGrant.external_reference,
  });
  const url = new URL(fetch.mock.calls[0]![0]);
  expect(url.pathname).toBe("/product-users/by-external-id/credit-grants/by-reference");
  expect(Object.fromEntries(url.searchParams)).toEqual({
    app_id: "app_retry", external_user_id: "customer_retry", external_reference: referencedCreditGrant.external_reference,
  });
  expect(fetch.mock.calls[0]![1].method).toBe("GET");
  expect(new Headers(fetch.mock.calls[0]![1].headers).get("authorization")).toBe("Bearer zrv_svc_retry");
  expect(grant).toEqual(referencedCreditGrant);
});

it("preserves reference conflicts without retrying the grant", async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: {
    code: "zorveus_product_user_credit_reference_conflict", message: "Different grant parameters",
  } }), { status: 409 }));
  const service = new ZorveusServiceClient({ apiKey: "zrv_svc_retry", fetch, maxRetries: 2 });
  await expect(service.productUsers.grantCreditByExternalId({
    appId: "app_retry", externalUserId: "customer_retry", amount: "6.000000000000",
    externalReference: referencedCreditGrant.external_reference,
  })).rejects.toMatchObject({ status: 409, code: "zorveus_product_user_credit_reference_conflict" });
  expect(fetch).toHaveBeenCalledTimes(1);
});

it("keeps grant transport failures under caller-controlled retries", async () => {
  const fetch = vi.fn().mockRejectedValue(new TypeError("Connection lost"));
  const service = new ZorveusServiceClient({ apiKey: "zrv_svc_retry", fetch, maxRetries: 2 });
  await expect(service.productUsers.grantCreditByExternalId({
    appId: "app_retry", externalUserId: "customer_retry", amount: "5.000000000000",
    externalReference: referencedCreditGrant.external_reference,
  })).rejects.toThrow();
  expect(fetch).toHaveBeenCalledTimes(1);
});


it("selects the allowance policy through headers and preserves exact returned units", async () => {
  const exactUnits = "1.123456789012345678901234";
  const fetchRequest = vi.fn().mockResolvedValue(new Response(JSON.stringify({
    app_id: "app_123", external_user_id: "shop_123", allowance: { remaining_credit_units: exactUnits },
  }), { status: 200 }));
  const service = new ZorveusServiceClient({
    apiKey: "zrv_svc_test", fetch: fetchRequest,
    defaultHeaders: { "x-zorveus-inference-key": "zrv_old_default", "x-zorveus-key-alias": "old" },
  });
  const user = await service.productUsers.getByExternalId({
    appId: "app_123", externalUserId: "shop_123", inferenceKey: "zrv_routing_test", keyAlias: "pro",
    upsertIfMissing: true,
  }, { headers: { "X-Zorveus-Inference-Key": "zrv_old_request" } });
  const [url, options] = fetchRequest.mock.calls[0];
  const headers = new Headers(options.headers);
  expect(headers.get("Authorization")).toBe("Bearer zrv_svc_test");
  expect(headers.get("X-Zorveus-Inference-Key")).toBe("zrv_routing_test");
  expect(headers.get("X-Zorveus-Key-Alias")).toBe("pro");
  expect(headers.get("X-Zorveus-Upsert-Product-User")).toBe("true");
  expect(new URL(String(url)).searchParams.has("inference_key")).toBe(false);
  expect(String(url)).not.toContain("zrv_routing_test");
  expect(user.allowance?.remaining_credit_units).toBe(exactUnits);
});

it("sends the explicit grant conversion rate as a decimal string", async () => {
  const fetchRequest = vi.fn().mockResolvedValue(new Response(JSON.stringify({
    product_user: { app_id: "app_123", external_user_id: "shop_123" },
    credit_grant: { credit_units_per_usd: "1500", remaining_credit_units: "3000" },
    credit_summary: { remaining_credit_units: "3000" },
  }), { status: 201 }));
  const service = new ZorveusServiceClient({ apiKey: "zrv_svc_test", fetch: fetchRequest });
  const result = await service.productUsers.grantCreditByExternalId({
    appId: "app_123", externalUserId: "shop_123", amount: "2", creditUnitsPerUsd: "1500",
    externalReference: "purchase:123",
  });
  expect(JSON.parse(fetchRequest.mock.calls[0][1].body)).toMatchObject({
    amount: "2", credit_units_per_usd: "1500", external_reference: "purchase:123",
  });
  expect(result.credit_grant.remaining_credit_units).toBe("3000");
  expect(result.credit_summary.remaining_credit_units).toBe("3000");
});
