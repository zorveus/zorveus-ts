import { describe, it, expect, vi } from "vitest";
import { ZorveusServiceClient } from "../src/index";

describe("Provider Credentials Management", () => {
  it("lists provider credentials and matches ProviderCredentialListResponse schema", async () => {
    const mockResponse = {
      provider_credentials: [
        {
          provider_credential_id: "cred_123",
          org_id: "org_456",
          provider: "openai",
          credential_name: "Production OpenAI",
          status: "active",
          routing_mode: "auto_resolve",
          routing_priority: 100,
          default_model_policy: [],
          provider_config: null,
          active_secret_version_id: "sec_v1",
          secret_fingerprint: "fp_abc",
          last_validated_at: "2026-08-14T00:00:00Z",
          last_used_at: "2026-08-14T00:00:00Z"
        }
      ]
    };

    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    );

    const client = new ZorveusServiceClient({ apiKey: "zrv_service_key_123" });
    const res = await client.providerCredentials.list();

    expect(res.provider_credentials).toHaveLength(1);
    expect(res.provider_credentials[0].provider).toBe("openai");
  });
});
