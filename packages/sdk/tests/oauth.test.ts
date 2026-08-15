import { describe, it, expect, vi } from "vitest";
import { ZorveusOAuth } from "../src/index";

describe("ZorveusOAuth PKCE & Token Exchange", () => {
  it("generates cryptographic PKCE parameters", async () => {
    const pkce = await ZorveusOAuth.generatePKCE();

    expect(pkce.codeVerifier).toBeDefined();
    expect(pkce.codeChallenge).toBeDefined();
    expect(pkce.state).toBeDefined();
    expect(pkce.codeVerifier.length).toBeGreaterThanOrEqual(43);
  });

  it("constructs authorization consent URL with default inference:write models:* scope", () => {
    const url = ZorveusOAuth.getAuthorizationUrl({
      clientId: "client_123",
      redirectUri: "http://localhost:3000/callback",
      state: "state_abc",
      codeChallenge: "challenge_xyz"
    });

    const parsedUrl = new URL(url);
    expect(parsedUrl.searchParams.get("client_id")).toBe("client_123");
    expect(parsedUrl.searchParams.get("scope")).toBe("inference:write models:*");
    expect(parsedUrl.searchParams.get("code_challenge_method")).toBe("S256");
  });

  it("validates callback parameters against CSRF state", () => {
    const validRes = ZorveusOAuth.validateCallback({
      urlOrParams: "http://localhost/callback?code=auth_code_123&state=state_abc",
      expectedState: "state_abc"
    });

    expect(validRes.valid).toBe(true);
    expect(validRes.code).toBe("auth_code_123");

    const invalidRes = ZorveusOAuth.validateCallback({
      urlOrParams: "http://localhost/callback?code=auth_code_123&state=WRONG_STATE",
      expectedState: "state_abc"
    });

    expect(invalidRes.valid).toBe(false);
    expect(invalidRes.error).toBe("state_mismatch");
  });

  it("safely handles object payloads with undefined and null fields in validateCallback", () => {
    const validObjectRes = ZorveusOAuth.validateCallback({
      urlOrParams: {
        code: "auth_code_456",
        state: "state_def",
        error: undefined as unknown as string,
        error_description: undefined as unknown as string
      },
      expectedState: "state_def"
    });

    expect(validObjectRes.valid).toBe(true);
    expect(validObjectRes.code).toBe("auth_code_456");
    expect(validObjectRes.error).toBeUndefined();

    const realErrorRes = ZorveusOAuth.validateCallback({
      urlOrParams: {
        error: "access_denied",
        error_description: "User denied consent"
      }
    });

    expect(realErrorRes.valid).toBe(false);
    expect(realErrorRes.error).toBe("access_denied");
    expect(realErrorRes.errorDescription).toBe("User denied consent");
  });

  it("exchanges auth code using application/x-www-form-urlencoded", async () => {
    const mockTokenRes = {
      access_token: "zrv_oauth_live_999",
      token_type: "bearer",
      expires_in: 3600,
      scope: "inference:write",
      app_connection_id: "conn_123",
      api_base: "https://api.zorveus.com/v1"
    };

    let capturedBody = "";
    let capturedContentType = "";

    global.fetch = vi.fn().mockImplementation(async (_url: string, init?: RequestInit) => {
      capturedBody = (init?.body as string) || "";
      capturedContentType = (init?.headers as Record<string, string>)["Content-Type"] || "";

      return new Response(JSON.stringify(mockTokenRes), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    });

    const token = await ZorveusOAuth.exchangeToken({
      clientId: "client_123",
      code: "code_abc",
      codeVerifier: "verifier_xyz",
      redirectUri: "http://localhost:3000/callback"
    });

    expect(capturedContentType).toBe("application/x-www-form-urlencoded");
    expect(capturedBody).toContain("grant_type=authorization_code");
    expect(capturedBody).toContain("code=code_abc");
    expect(capturedBody).toContain("code_verifier=verifier_xyz");
    expect(token.access_token).toBe("zrv_oauth_live_999");
    expect(token.app_connection_id).toBe("conn_123");
  });
});
