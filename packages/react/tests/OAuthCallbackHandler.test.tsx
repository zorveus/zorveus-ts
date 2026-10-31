import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { type OAuthTokenResponse } from "@zorveus/sdk";
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
    vi.unstubAllGlobals();
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
    window.sessionStorage.setItem("zorveus_oauth_state", "test_state");
    window.history.replaceState({}, "", "/oauth/callback?code=auth_code_xyz&state=test_state");

    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(fakeTokenRes), { status: 200 }));
    vi.stubGlobal("fetch", fetch);
    const onSuccess = vi.fn();

    render(
      <ZorveusProvider clientId="zrv_client_123" redirectUri="http://localhost:5175/oauth/callback">
        <OAuthCallbackHandler onSuccess={onSuccess} />
        <AuthStatus />
      </ZorveusProvider>
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    const [url, request] = fetch.mock.calls[0];
    expect(url).toBe("https://api.zorveus.com/oauth/token");
    expect(Object.fromEntries(new URLSearchParams(request.body))).toEqual({
      grant_type: "authorization_code",
      client_id: "zrv_client_123",
      code: "auth_code_xyz",
      code_verifier: "test_code_verifier_12345",
      redirect_uri: "http://localhost:5175/oauth/callback"
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


it.each([null, "different_state"])("rejects a redirect callback without matching saved state: %s", async (savedState) => {
  window.sessionStorage.clear();
  window.sessionStorage.setItem("zorveus_oauth_verifier", "test_verifier");
  if (savedState !== null) window.sessionStorage.setItem("zorveus_oauth_state", savedState);
  window.history.replaceState({}, "", "/oauth/callback?code=code_test&state=returned_state");
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  const onError = vi.fn();
  try {
    render(<ZorveusProvider clientId="client_test" redirectUri="http://localhost/oauth/callback">
      <OAuthCallbackHandler onError={onError} />
    </ZorveusProvider>);
    await waitFor(() => expect(onError).toHaveBeenCalledWith("state_mismatch", expect.any(String)));
    expect(fetch).not.toHaveBeenCalled();
  } finally { vi.unstubAllGlobals(); }
});


it.each([null, "different_state", "returned_state"])("validates the saved state before reporting an OAuth error: %s", async (savedState) => {
  window.sessionStorage.clear();
  if (savedState !== null) window.sessionStorage.setItem("zorveus_oauth_state", savedState);
  window.history.replaceState({}, "", "/oauth/callback?error=access_denied&error_description=User+declined&state=returned_state");
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  const onError = vi.fn();
  try {
    render(<ZorveusProvider clientId="client_test" redirectUri="http://localhost/oauth/callback">
      <OAuthCallbackHandler onError={onError} />
    </ZorveusProvider>);
    await waitFor(() => expect(onError).toHaveBeenCalledWith(
      savedState === "returned_state" ? "access_denied" : "state_mismatch", expect.any(String)
    ));
    expect(fetch).not.toHaveBeenCalled();
  } finally { vi.unstubAllGlobals(); }
});

it("relays a popup denial to the initiating window so its saved state can be checked", async () => {
  window.history.replaceState({}, "", "/oauth/callback?error=access_denied&error_description=User+declined&state=pending_state");
  const postMessage = vi.fn();
  const close = vi.fn();
  vi.stubGlobal("opener", { postMessage });
  vi.stubGlobal("close", close);
  try {
    render(<OAuthCallbackHandler />);
    expect(postMessage).toHaveBeenCalledWith({
      type: "ZORVEUS_OAUTH_RESPONSE",
      payload: { error: "access_denied", error_description: "User declined", state: "pending_state" }
    }, window.location.origin);
    expect(JSON.parse(window.localStorage.getItem("zorveus_oauth_callback_result")!)).toMatchObject({
      error: "access_denied", state: "pending_state"
    });
    await waitFor(() => expect(close).toHaveBeenCalled());
  } finally { vi.unstubAllGlobals(); }
});
