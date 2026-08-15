import { describe, it, expect, vi } from "vitest";
import { ZorveusServiceClient } from "../src/index";

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

  it("grants credit with decimal validation and returns GrantProductUserCreditsResponse", async () => {
    const mockResponse = {
      product_user: {
        product_end_user_id: "usr_123",
        org_id: "org_456",
        app_id: "app_789",
        external_user_id: "ext_001",
        display_name: "Jane",
        email_hash: null,
        status: "active",
        metadata: null,
        usage: {}
      },
      credit_grant: {
        credit_grant_id: "grant_999",
        org_id: "org_456",
        app_id: "app_789",
        product_end_user_id: "usr_123",
        amount: "50.0000",
        remaining_amount: "50.0000",
        currency: "USD",
        source: "startup_grant",
        reason: "Onboarding bonus",
        status: "active",
        expires_at: null,
        metadata: null,
        created_at: "2026-08-14T00:00:00Z",
        updated_at: "2026-08-14T00:00:00Z"
      },
      credit_summary: {
        product_end_user_id: "usr_123",
        total_granted: "50.0000",
        total_remaining: "50.0000",
        active_grants_count: 1
      }
    };

    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    );

    const client = new ZorveusServiceClient({ apiKey: "zrv_service_key_123" });
    const res = await client.productUsers.grantCredit("usr_123", {
      amount: "50.0000",
      reason: "Onboarding bonus"
    });

    expect(res.credit_grant.credit_grant_id).toBe("grant_999");
    expect(res.credit_grant.amount).toBe("50.0000");
    expect(res.credit_summary.total_remaining).toBe("50.0000");
  });

  it("throws InvalidDecimalError when amount is not a valid decimal string", async () => {
    const client = new ZorveusServiceClient({ apiKey: "zrv_service_key_123" });
    await expect(
      client.productUsers.grantCredit("usr_123", { amount: "INVALID_50" })
    ).rejects.toThrow("must be a valid decimal string");
  });
});
