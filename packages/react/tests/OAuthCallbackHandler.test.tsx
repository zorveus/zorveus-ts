import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ZorveusOAuth, type OAuthTokenResponse } from "@zorveus/sdk";
import { ZorveusProvider, OAuthCallbackHandler, useZorveusAuth } from "../src/index";

function AuthStatus() {
  const { isConnected, accessToken } = useZorveusAuth();
  return (
    <div>
      <span data-testid="status">{isConnected ? "connected" : "disconnected"}</span>
      <span data-testid="token">{accessToken || "none"}</span>
    </div>
  );
}

describe("OAuthCallbackHandler", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/oauth/callback");
    vi.restoreAllMocks();
  });

  it("returns null when no code or error is in URL and idle", () => {
    const { container } = render(
      <ZorveusProvider clientId="zrv_client_123" redirectUri="http://localhost:5175/oauth/callback">
        <OAuthCallbackHandler />
      </ZorveusProvider>
    );

    expect(container.firstChild).toBeNull();
  });

  it("exchanges code via PKCE in SPA redirect mode without duplicate execution", async () => {
    const fakeTokenRes: OAuthTokenResponse = {
      access_token: "zrv_live_test_token_123",
      token_type: "Bearer",
      expires_in: 3600,
      scope: "inference:write models:*",
      app_connection_id: "appconn_123",
      api_base: "http://localhost:4000/v1"
    };

    window.sessionStorage.setItem("zorveus_oauth_verifier", "test_code_verifier_12345");
    window.history.replaceState({}, "", "/oauth/callback?code=auth_code_xyz&state=test_state");

    const exchangeSpy = vi.spyOn(ZorveusOAuth, "exchangeToken").mockResolvedValue(fakeTokenRes);
    const onSuccess = vi.fn();

    render(
      <ZorveusProvider clientId="zrv_client_123" redirectUri="http://localhost:5175/oauth/callback">
        <OAuthCallbackHandler onSuccess={onSuccess} />
        <AuthStatus />
      </ZorveusProvider>
    );

    await waitFor(() => {
      expect(exchangeSpy).toHaveBeenCalledTimes(1);
    });

    expect(exchangeSpy).toHaveBeenCalledWith({
      clientId: "zrv_client_123",
      clientSecret: undefined,
      code: "auth_code_xyz",
      codeVerifier: "test_code_verifier_12345",
      redirectUri: "http://localhost:5175/oauth/callback",
      baseURL: "https://api.zorveus.com"
    });

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("connected");
      expect(screen.getByTestId("token").textContent).toBe("zrv_live_test_token_123");
    });

    expect(onSuccess).toHaveBeenCalledWith("auth_code_xyz", "test_state", fakeTokenRes);
    expect(window.sessionStorage.getItem("zorveus_oauth_verifier")).toBeNull();
    // Query string should have been stripped from URL
    expect(window.location.search).toBe("");
  });

  it("shows error if PKCE code verifier is truly missing on initial redirect", async () => {
    window.history.replaceState({}, "", "/oauth/callback?code=auth_code_xyz");
    const onError = vi.fn();

    render(
      <ZorveusProvider clientId="zrv_client_123" redirectUri="http://localhost:5175/oauth/callback">
        <OAuthCallbackHandler onError={onError} />
      </ZorveusProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Authorization Failed")).toBeDefined();
      expect(screen.getByText("Missing OAuth PKCE code verifier in session storage.")).toBeDefined();
    });

    expect(onError).toHaveBeenCalledWith("missing_verifier", "Missing OAuth PKCE code verifier in session storage.");
  });
});
