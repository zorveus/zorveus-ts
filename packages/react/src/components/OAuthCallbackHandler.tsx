import React, { useEffect, useState } from "react";
import { ZorveusOAuth, type OAuthTokenResponse } from "@zorveus/sdk";
import { useOptionalZorveusContext } from "../context/ZorveusContext";

export interface OAuthCallbackHandlerProps {
  onSuccess?: (code: string, state?: string, session?: OAuthTokenResponse) => void;
  onError?: (error: string, description?: string) => void;
  /**
   * Optional route to navigate to after successful token exchange in direct redirect mode.
   */
  redirectTo?: string;
}

/**
 * Official Zorveus OAuth Callback Handler component.
 * Supports both popup mode (broadcasting to opener) and SPA redirect mode (auto-exchanging PKCE tokens).
 */
export function OAuthCallbackHandler({
  onSuccess,
  onError,
  redirectTo
}: OAuthCallbackHandlerProps = {}): React.JSX.Element | null {
  const context = useOptionalZorveusContext();
  const [closed, setClosed] = useState(false);
  const [exchangeState, setExchangeState] = useState<"idle" | "exchanging" | "done" | "error">("idle");
  const [exchangeError, setExchangeError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state") || undefined;
    const error = urlParams.get("error") || undefined;
    const errorDescription = urlParams.get("error_description") || undefined;

    if (!code && !error) {
      return;
    }

    if (error) {
      onError?.(error, errorDescription);
      setExchangeError(errorDescription || error);
      setExchangeState("error");
      return;
    }

    const payload: Record<string, string> = {};
    if (code) payload.code = code;
    if (state) payload.state = state;

    // Mode A: Popup Window Flow (window.opener exists)
    if (window.opener) {
      try {
        window.opener.postMessage(
          {
            type: "ZORVEUS_OAUTH_RESPONSE",
            payload
          },
          window.location.origin
        );
      } catch {
        // Fall back to localStorage channel
      }

      try {
        window.localStorage.setItem(
          "zorveus_oauth_callback_result",
          JSON.stringify({
            ...payload,
            timestamp: Date.now()
          })
        );
      } catch {
        // Ignore storage write errors
      }

      if (code) {
        onSuccess?.(code, state);
      }

      setTimeout(() => {
        try {
          window.close();
          setClosed(true);
        } catch {
          setClosed(true);
        }
      }, 250);
      return;
    }

    // Mode B: Direct SPA Redirect Flow (no window.opener)
    if (!code || !context) return;

    const codeVerifier = window.sessionStorage.getItem("zorveus_oauth_verifier");
    if (!codeVerifier) {
      const msg = "Missing OAuth PKCE code verifier in session storage.";
      onError?.("missing_verifier", msg);
      setExchangeError(msg);
      setExchangeState("error");
      return;
    }

    setExchangeState("exchanging");

    ZorveusOAuth.exchangeToken({
      clientId: context.clientId,
      clientSecret: context.clientSecret,
      code,
      codeVerifier,
      redirectUri: context.redirectUri,
      baseURL: context.authBaseUrl
    })
      .then((tokenRes: OAuthTokenResponse) => {
        window.sessionStorage.removeItem("zorveus_oauth_verifier");
        window.sessionStorage.removeItem("zorveus_oauth_state");

        context.setOAuthSession(tokenRes);
        setExchangeState("done");
        onSuccess?.(code, state, tokenRes);

        if (redirectTo && typeof window !== "undefined") {
          window.location.replace(redirectTo);
        }
      })
      .catch((err: unknown) => {
        const e = err instanceof Error ? err.message : String(err);
        setExchangeError(e);
        setExchangeState("error");
        onError?.("exchange_failed", e);
      });
  }, [context, onSuccess, onError, redirectTo]);

  if (typeof window === "undefined") return null;

  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");
  const error = urlParams.get("error");
  const errorDescription = urlParams.get("error_description");

  if (!code && !error) return null;

  const displayError = errorDescription || error || exchangeError;
  const isPending = exchangeState === "exchanging";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "24px",
        backgroundColor: "#F8FAFC",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        textAlign: "center"
      }}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          padding: "36px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          maxWidth: "400px",
          border: "1px solid #E2E8F0"
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            backgroundColor: displayError ? "#FEF2F2" : isPending ? "#EFF6FF" : "#ECFDF5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px auto"
          }}
        >
          {displayError ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          ) : isPending ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>

        <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0F172A", marginBottom: "8px" }}>
          {displayError
            ? "Authorization Failed"
            : isPending
              ? "Connecting Your AI Wallet..."
              : "Wallet Connection Complete!"}
        </h2>

        <p style={{ fontSize: "14px", color: "#64748B", lineHeight: 1.5, marginBottom: "20px" }}>
          {displayError
            ? displayError
            : isPending
              ? "Exchanging authorization credentials with Zorveus securely via PKCE..."
              : "Your Zorveus AI Wallet authorization was successful."}
        </p>

        {closed && (
          <button
            type="button"
            onClick={() => window.close()}
            style={{
              padding: "10px 20px",
              backgroundColor: "#2563EB",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer"
            }}
          >
            Close Window
          </button>
        )}
      </div>
    </div>
  );
}
