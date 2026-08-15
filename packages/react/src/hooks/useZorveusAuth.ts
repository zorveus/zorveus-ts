import { useState, useCallback } from "react";
import { ZorveusOAuth } from "@zorveus/sdk";
import { useZorveusContext } from "../context/ZorveusContext";

export interface UseZorveusAuthReturn {
  isConnected: boolean;
  accessToken: string | null;
  appConnectionId: string | null;
  isLoading: boolean;
  error: Error | null;
  connect: (scopes?: string[]) => Promise<void>;
  disconnect: () => void;
}

export function useZorveusAuth(): UseZorveusAuthReturn {
  const {
    isConnected,
    accessToken,
    appConnectionId,
    clientId,
    clientSecret,
    redirectUri,
    authBaseUrl,
    setOAuthSession,
    clearOAuthSession
  } = useZorveusContext();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const connect = useCallback(
    async (scopes: string[] = ["inference:write", "models:*"]) => {
      setIsLoading(true);
      setError(null);

      try {
        const pkce = await ZorveusOAuth.generatePKCE();
        console.log("[useZorveusAuth] Initialized PKCE credentials:", {
          state: pkce.state,
          codeChallenge: pkce.codeChallenge,
          codeVerifierPrefix: `${pkce.codeVerifier.slice(0, 8)}...`
        });

        if (typeof window !== "undefined") {
          window.sessionStorage.setItem("zorveus_oauth_verifier", pkce.codeVerifier);
          window.sessionStorage.setItem("zorveus_oauth_state", pkce.state);
        }

        const authUrl = ZorveusOAuth.getAuthorizationUrl({
          clientId,
          redirectUri,
          state: pkce.state,
          codeChallenge: pkce.codeChallenge,
          scopes,
          baseURL: authBaseUrl
        });
        console.log("[useZorveusAuth] Authorization URL generated:", authUrl);

        // Launch OAuth Consent Popup
        const width = 540;
        const height = 680;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const popup = window.open(
          authUrl,
          "Zorveus OAuth Consent",
          `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,status=yes`
        );

        if (!popup) {
          throw new Error("Failed to open OAuth popup. Please disable popup blocker.");
        }

        // Clear any previous stale storage result
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("zorveus_oauth_callback_result");
        }

        // Wait for OAuth redirect message with timeout and closed-window cleanup
        await new Promise<void>((resolve, reject) => {
          let timeoutId: number;
          let checkClosedInterval: number;
          let isProcessing = false;

          const cleanup = () => {
            if (typeof window !== "undefined") {
              window.removeEventListener("message", handleMessage);
              window.removeEventListener("storage", handleStorage);
              window.localStorage.removeItem("zorveus_oauth_callback_result");
            }
            if (timeoutId) window.clearTimeout(timeoutId);
            if (checkClosedInterval) window.clearInterval(checkClosedInterval);
          };

          // 5-minute timeout
          timeoutId = window.setTimeout(() => {
            cleanup();
            if (popup && !popup.closed) popup.close();
            reject(new Error("OAuth authentication timed out after 5 minutes."));
          }, 300000);

          const processPayload = (payload: Record<string, string>) => {
            if (isProcessing) return;
            isProcessing = true;
            cleanup();

            console.log("[useZorveusAuth] Received callback payload:", payload);

            const validation = ZorveusOAuth.validateCallback({
              urlOrParams: payload || {},
              expectedState: pkce.state
            });

            console.log("[useZorveusAuth] Callback validation result:", validation);

            if (!validation.valid || !validation.code) {
              if (popup && !popup.closed) popup.close();
              const err = new Error(
                validation.errorDescription || validation.error || "OAuth callback validation failed."
              );
              console.error("[useZorveusAuth] OAuth Validation Error:", err);
              reject(err);
              return;
            }

            console.log("[useZorveusAuth] Exchanging authorization code for inference key token...");

            // Exchange code for token
            ZorveusOAuth.exchangeToken({
              clientId,
              clientSecret,
              code: validation.code,
              codeVerifier: pkce.codeVerifier,
              redirectUri,
              baseURL: authBaseUrl
            })
              .then((tokenRes) => {
                console.log("[useZorveusAuth] OAuth token exchange completed successfully!");
                if (popup && !popup.closed) popup.close();
                setOAuthSession(tokenRes);
                resolve();
              })
              .catch((err) => {
                if (popup && !popup.closed) popup.close();
                console.error("[useZorveusAuth] OAuth Exchange Error:", err);
                reject(err);
              });
          };

          // Check for callback result or popup closure every 100ms
          checkClosedInterval = window.setInterval(() => {
            if (isProcessing) return;

            const stored = window.localStorage.getItem("zorveus_oauth_callback_result");
            if (stored) {
              try {
                const parsed = JSON.parse(stored);
                if (parsed && (parsed.code || parsed.error)) {
                  processPayload(parsed);
                  return;
                }
              } catch {
                // Ignore JSON parse errors
              }
            }

            if (popup.closed) {
              cleanup();
              reject(new Error("OAuth authorization popup was closed before completion."));
            }
          }, 100);

          const handleMessage = (event: MessageEvent) => {
            if (event.data?.type !== "ZORVEUS_OAUTH_RESPONSE") return;
            processPayload(event.data.payload || {});
          };

          const handleStorage = (event: StorageEvent) => {
            if (event.key !== "zorveus_oauth_callback_result" || !event.newValue) return;
            try {
              const parsed = JSON.parse(event.newValue);
              processPayload(parsed);
            } catch {
              // Ignore
            }
          };

          window.addEventListener("message", handleMessage);
          window.addEventListener("storage", handleStorage);
        });
      } catch (err) {
        const authError = err instanceof Error ? err : new Error(String(err));
        setError(authError);
        throw authError;
      } finally {
        setIsLoading(false);
      }
    },
    [clientId, clientSecret, redirectUri, setOAuthSession, authBaseUrl]
  );

  const disconnect = useCallback(() => {
    clearOAuthSession();
  }, [clearOAuthSession]);

  return {
    isConnected,
    accessToken,
    appConnectionId,
    isLoading,
    error,
    connect,
    disconnect
  };
}
