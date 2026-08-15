import React, { createContext, useContext, useState, useMemo, useEffect } from "react";
import { Zorveus } from "@zorveus/sdk";

export interface ZorveusAuthState {
  isConnected: boolean;
  accessToken: string | null;
  appConnectionId: string | null;
  apiBase: string | null;
  error: Error | null;
}

export interface ZorveusContextValue extends ZorveusAuthState {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  baseURL: string;
  gatewayBaseURL: string;
  authBaseUrl: string;
  client: Zorveus | null;
  setOAuthSession: (session: { access_token: string; app_connection_id?: string; api_base?: string }) => void;
  clearOAuthSession: () => void;
}

const ZorveusContext = createContext<ZorveusContextValue | undefined>(undefined);

export interface ZorveusProviderProps {
  children: React.ReactNode;
  clientId: string;
  redirectUri: string;

  /**
   * Optional client secret for confidential OAuth clients.
   */
  clientSecret?: string;

  /**
   * Optional direct inference key (`zrv_...`) for non-OAuth applications.
   */
  inferenceKey?: string;

  /**
   * Base URL for the Zorveus API (OAuth, Usage, Models, etc.).
   * @default "https://api.zorveus.com"
   */
  baseURL?: string;

  /**
   * Base URL for the Zorveus Gateway.
   * @default `${baseURL}/v1` ("https://api.zorveus.com/v1")
   */
  gatewayBaseURL?: string;

  /**
   * Optional alias for baseURL (Zorveus OAuth Server URL).
   * @default baseURL || "https://api.zorveus.com"
   */
  authBaseUrl?: string;

  /**
   * Whether to persist the OAuth access token in localStorage.
   * Defaults to `false` (in-memory storage) for XSS security.
   * @default false
   */
  persistToken?: boolean;
}

const STORAGE_KEY = "zorveus_oauth_session_v1";

export function ZorveusProvider(props: ZorveusProviderProps): React.JSX.Element {
  const {
    children,
    clientId,
    clientSecret,
    redirectUri,
    inferenceKey,
    persistToken = false
  } = props;

  const resolvedBaseURL = (props.baseURL || props.authBaseUrl || "https://api.zorveus.com").replace(/\/+$/, "");
  const resolvedGatewayBaseURL = (props.gatewayBaseURL || `${resolvedBaseURL}/v1`).replace(/\/+$/, "");

  const [authState, setAuthState] = useState<ZorveusAuthState>(() => {
    if (persistToken && typeof window !== "undefined") {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          return {
            isConnected: true,
            accessToken: parsed.access_token,
            appConnectionId: parsed.app_connection_id || null,
            apiBase: parsed.api_base || null,
            error: null
          };
        }
      } catch {
        // Fall back to clean unauthenticated state on parse error
      }
    }

    return {
      isConnected: false,
      accessToken: inferenceKey || null,
      appConnectionId: null,
      apiBase: null,
      error: null
    };
  });

  // Sync direct inferenceKey if provided without overwriting connection state
  useEffect(() => {
    if (inferenceKey && !authState.accessToken) {
      setAuthState((prev) => ({
        ...prev,
        accessToken: inferenceKey
      }));
    }
  }, [inferenceKey, authState.accessToken]);

  const setOAuthSession = (session: { access_token: string; app_connection_id?: string; api_base?: string }) => {
    const newState: ZorveusAuthState = {
      isConnected: true,
      accessToken: session.access_token,
      appConnectionId: session.app_connection_id || null,
      apiBase: session.api_base || null,
      error: null
    };

    setAuthState(newState);

    if (persistToken && typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      } catch {
        // Ignore storage write errors
      }
    }
  };

  const clearOAuthSession = () => {
    setAuthState({
      isConnected: false,
      accessToken: null,
      appConnectionId: null,
      apiBase: null,
      error: null
    });

    if (persistToken && typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore storage remove errors
      }
    }
  };

  // Create memoized Zorveus Inference Gateway client
  const client = useMemo(() => {
    const keyToUse = authState.accessToken || inferenceKey;
    if (!keyToUse) return null;

    return new Zorveus({
      apiKey: keyToUse,
      baseURL: resolvedBaseURL,
      gatewayBaseURL: authState.apiBase || resolvedGatewayBaseURL
    });
  }, [authState.accessToken, authState.apiBase, inferenceKey, resolvedBaseURL, resolvedGatewayBaseURL]);

  const value: ZorveusContextValue = {
    ...authState,
    isConnected: Boolean(authState.accessToken || inferenceKey),
    clientId,
    clientSecret,
    redirectUri,
    baseURL: resolvedBaseURL,
    gatewayBaseURL: resolvedGatewayBaseURL,
    authBaseUrl: resolvedBaseURL,
    client,
    setOAuthSession,
    clearOAuthSession
  };

  return <ZorveusContext.Provider value={value}>{children}</ZorveusContext.Provider>;
}

export function useOptionalZorveusContext(): ZorveusContextValue | null {
  return useContext(ZorveusContext) ?? null;
}

export function useZorveusContext(): ZorveusContextValue {
  const context = useContext(ZorveusContext);
  if (!context) {
    throw new Error("Zorveus hooks and components must be used within a <ZorveusProvider>.");
  }
  return context;
}
