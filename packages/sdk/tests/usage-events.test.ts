import { describe, expect, it, vi } from "vitest";
import { normalInputTokens, ZorveusServiceClient } from "../src/index";

describe("Usage events", () => {
  it("lists cache-aware usage events with cursor filters", async () => {
    const event = {
      usage_event_id: "ue_123",
      zorveus_request_id: "zreq_123",
      app_id: "app_123",
      app_connection_id: "aconn_123",
      product_end_user_id: "peu_123",
      external_user_id: null,
      member_user_id: null,
      org_member_id: null,
      org_id: "org_123",
      model: "anthropic/claude-sonnet-4-5",
      provider: "anthropic",
      provider_model: "claude-sonnet-4-5",
      input_tokens: 10000,
      output_tokens: 2000,
      cache_read_input_tokens: 7000,
      cache_creation_input_tokens: 1500,
      cache_creation_1h_input_tokens: 500,
      cache_usage_breakdown_status: "reported",
      pricing_service_tier: "standard",
      cache_pricing_fallback_reason: null,
      cache_savings: "0.0105000000",
      provider_cost: "0.0180000000",
      sell_cost: "0.0000000000",
      virtual_spend: "0.0250000000",
      uncovered_virtual_spend: "0.0000000000",
      unfunded_wallet_charge: "0.0000000000",
      usage_cost: "0.0250000000",
      billing_mode: "byok_external",
      status: "succeeded",
      created_at: "2026-09-08T12:00:00Z"
    };

    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ events: [event], next_cursor: "next", has_more: true, limit: 1 }))
    );

    const client = new ZorveusServiceClient({ apiKey: "zrv_service_test" });
    const page = await client.usageEvents.list({ orgId: "org_123", limit: 1, cursor: "start" });

    expect(page.events[0]?.cache_savings).toBe("0.0105000000");
    expect(normalInputTokens(page.events[0]!)).toBe(1000);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.zorveus.com/dashboard-api/usage/events?org_id=org_123&limit=1&cursor=start",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("does not infer normal input when the cache breakdown was not reported", () => {
    expect(normalInputTokens({
      cache_usage_breakdown_status: "not_reported",
      input_tokens: 10
    } as never)).toBeNull();
  });
});
