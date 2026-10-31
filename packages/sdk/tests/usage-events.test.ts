import { describe, expect, it, vi } from "vitest";
import { normalInputTokens, ZorveusServiceClient } from "../src/index";

describe("Usage events", () => {
  it("rejects dashboard analytics without sending a service key to a session route", async () => {
    const fetch = vi.fn();
    const client = new ZorveusServiceClient({ apiKey: "zrv_svc_test", fetch });
    await expect(client.usageEvents.list({ orgId: "org_test" })).rejects.toMatchObject({
      code: "zorveus_dashboard_session_required"
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("does not infer normal input when the cache breakdown was not reported", () => {
    expect(normalInputTokens({
      cache_usage_breakdown_status: "not_reported",
      input_tokens: 10
    } as never)).toBeNull();
  });
});
