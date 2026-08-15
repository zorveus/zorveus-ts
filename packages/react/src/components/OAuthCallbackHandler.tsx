import React, { useEffect, useState } from "react";

export interface OAuthCallbackHandlerProps {
  onSuccess?: (code: string, state?: string) => void;
  onError?: (error: string, description?: string) => void;
}

/**
 * Official Zorveus OAuth Callback Handler component.
 * Parses query params after authorization consent, broadcasts payload to opener window
 * via dual-channel (postMessage + localStorage), and handles window closing.
 */
export function OAuthCallbackHandler({
  onSuccess,
  onError
}: OAuthCallbackHandlerProps = {}): React.JSX.Element | null {
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state") || undefined;
    const error = urlParams.get("error") || undefined;
    const errorDescription = urlParams.get("error_description") || undefined;

    console.log("[OAuthCallbackHandler] Callback URL Search:", window.location.search);
    console.log("[OAuthCallbackHandler] Parsed params:", { code, state, error, errorDescription });

    if (!code && !error) {
      console.warn("[OAuthCallbackHandler] No code or error found in URL search params.");
      return;
    }

    const payload: Record<string, string> = {};
    if (code) payload.code = code;
    if (state) payload.state = state;
    if (error) payload.error = error;
    if (errorDescription) payload.error_description = errorDescription;

    console.log("[OAuthCallbackHandler] Broadcasting payload to parent:", payload);

    // Channel 1: postMessage to opener
    if (window.opener) {
      try {
        window.opener.postMessage(
          {
            type: "ZORVEUS_OAUTH_RESPONSE",
            payload
          },
          "*"
        );
        console.log("[OAuthCallbackHandler] Broadcasted via postMessage to window.opener");
      } catch (err) {
        console.warn("[OAuthCallbackHandler] postMessage broadcast failed:", err);
      }
    } else {
      console.log("[OAuthCallbackHandler] window.opener is not available (using localStorage channel)");
    }

    // Channel 2: localStorage storage event broadcast
    try {
      window.localStorage.setItem(
        "zorveus_oauth_callback_result",
        JSON.stringify({
          ...payload,
          timestamp: Date.now()
        })
      );
      console.log("[OAuthCallbackHandler] Broadcasted via localStorage storage event");
    } catch (err) {
      console.warn("[OAuthCallbackHandler] localStorage write failed:", err);
    }

    if (code) {
      onSuccess?.(code, state);
    } else if (error) {
      onError?.(error, errorDescription);
    }

    // Allow 250ms for postMessage and localStorage events to flush before closing popup
    setTimeout(() => {
      try {
        window.close();
        setClosed(true);
      } catch {
        setClosed(true);
      }
    }, 250);
  }, [onSuccess, onError]);

  if (typeof window === "undefined") return null;

  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");
  const error = urlParams.get("error");
  const errorDescription = urlParams.get("error_description");

  if (!code && !error) return null;

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
            backgroundColor: error ? "#FEF2F2" : "#ECFDF5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px auto"
          }}
        >
          {error ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>

        <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0F172A", marginBottom: "8px" }}>
          {error ? "Authorization Failed" : "Wallet Connection Complete!"}
        </h2>

        <p style={{ fontSize: "14px", color: "#64748B", lineHeight: 1.5, marginBottom: "20px" }}>
          {error
            ? errorDescription || error
            : "Your Zorveus AI Wallet authorization was successful. You may close this window now."}
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
