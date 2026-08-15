import { describe, it, expect, vi } from "vitest";
import { Zorveus, ZorveusInferenceClient, ZorveusServiceClient } from "../src/index";

describe("Client Instantiation & Usage", () => {
  it("instantiates ZorveusInferenceClient with inference key", () => {
    const client = new Zorveus({
      apiKey: "zrv_live_test_12345"
    });

    expect(client).toBeInstanceOf(ZorveusInferenceClient);
    expect(client.chat).toBeDefined();
    expect(client.embeddings).toBeDefined();
    expect(client.models).toBeDefined();
  });

  it("fetches inference key usage and budget cap via getUsage()", async () => {
    const mockUsage = {
      status: "active",
      app_id: "app_mindspire_123",
      app_connection_id: "appcon_01j6abc",
      currency: "USD",
      period: "monthly",
      spend_cap: "50.000000000000",
      spent_this_period: "12.500000000000",
      remaining_balance: "37.500000000000",
      reset_at: "2026-09-01T00:00:00Z"
    };

    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockUsage), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    );

    const client = new Zorveus({ apiKey: "zrv_live_test_12345" });
    const usage = await client.getUsage();

    expect(usage.status).toBe("active");
    expect(usage.spend_cap).toBe("50.000000000000");
    expect(usage.spent_this_period).toBe("12.500000000000");
    expect(usage.remaining_balance).toBe("37.500000000000");
    expect(usage.currency).toBe("USD");
  });

  it("throws error when ZorveusInferenceClient is missing apiKey", () => {
    expect(() => new Zorveus({ apiKey: "" })).toThrow("ZorveusInferenceClient requires an 'apiKey'");
  });

  it("instantiates ZorveusServiceClient with service key", () => {
    const client = new ZorveusServiceClient({
      apiKey: "zrv_service_test_12345"
    });

    expect(client.productUsers).toBeDefined();
    expect(client.providerCredentials).toBeDefined();
  });

  it("throws error when ZorveusServiceClient is missing apiKey", () => {
    expect(() => new ZorveusServiceClient({ apiKey: "" })).toThrow("ZorveusServiceClient requires an 'apiKey'");
  });
});
