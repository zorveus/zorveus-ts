import React, { createContext, useContext, useState, useMemo, useEffect } from "react";
import { Zorveus } from "@zorveus/sdk";
import { ZorveusOpenAI } from "@zorveus/sdk/openai";

export interface ZorveusOAuthSessionPayload {
  access_token: string;
  app_connection_id?: string;
  api_base?: string;
}

export type ZorveusTokenProvider = () => Promise<string | ZorveusOAuthSessionPayload | null>;

export interface ZorveusAuthState {
  isConnected: boolean;
  accessToken: string | null;
  appConnectionId: string | null;
  apiBase: string | null;
  error: Error | null;
  isLoadingAuth: boolean;
}

export interface ZorveusContextValue extends ZorveusAuthState {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  baseURL: string;
  gatewayBaseURL: string;
  authBaseUrl: string;
  client: Zorveus | null;
  openAIClient: ZorveusOpenAI | null;
  setOAuthSession: (session: ZorveusOAuthSessionPayload) => void;
  clearOAuthSession: () => void;
}

const ZorveusContext = createContext<ZorveusContextValue | undefined>(undefined);

export interface ZorveusProviderProps {
  children: React.ReactNode;
  clientId: string;
  redirectUri: string;

  /**
   * Synchronous OAuth access token or inference key.
   * Eliminates the unauthenticated first-render flash when sessions are resolved externally.
   */
  accessToken?: string | null;

  /**
   * Async token resolver. Executed on mount or when called.
   * Keeps `isLoadingAuth: true` until resolution so child hooks don't flash premature errors.
   */
  tokenProvider?: ZorveusTokenProvider;

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
  const initialToken = props.accessToken || inferenceKey || null;

  const [authState, setAuthState] = useState<ZorveusAuthState>(() => {
    if (props.accessToken) {
      return {
        isConnected: true,
        accessToken: props.accessToken,
        appConnectionId: null,
        apiBase: null,
        error: null,
        isLoadingAuth: false
      };
    }

    if (props.tokenProvider) {
      return {
        isConnected: false,
        accessToken: null,
        appConnectionId: null,
        apiBase: null,
        error: null,
        isLoadingAuth: true
      };
    }

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
            error: null,
            isLoadingAuth: false
          };
        }
      } catch {
        // Fall back to clean unauthenticated state on parse error
      }
    }

    return {
      isConnected: Boolean(initialToken),
      accessToken: initialToken,
      appConnectionId: null,
      apiBase: null,
      error: null,
      isLoadingAuth: false
    };
  });

  // Sync direct inferenceKey if provided without overwriting connection state
  useEffect(() => {
    if (inferenceKey && !authState.accessToken) {
      setAuthState((prev) => ({
        ...prev,
        isConnected: true,
        accessToken: inferenceKey
      }));
    }
  }, [inferenceKey, authState.accessToken]);

  // Sync synchronous accessToken prop changes
  useEffect(() => {
    if (props.accessToken === undefined) return;
    if (props.accessToken === null) {
      clearOAuthSession();
      return;
    }
    if (props.accessToken !== authState.accessToken) {
      setAuthState((prev) => ({
        ...prev,
        isConnected: true,
        accessToken: props.accessToken as string,
        isLoadingAuth: false,
        error: null
      }));
    }
  }, [props.accessToken]);

  // Handle async tokenProvider prop
  useEffect(() => {
    if (!props.tokenProvider) return;

    let isCancelled = false;
    setAuthState((prev) => ({ ...prev, isLoadingAuth: true }));

    props.tokenProvider()
      .then((res) => {
        if (isCancelled) return;
        if (!res) {
          setAuthState((prev) => ({ ...prev, isLoadingAuth: false }));
          return;
        }

        if (typeof res === "string") {
          setAuthState({
            isConnected: true,
            accessToken: res,
            appConnectionId: null,
            apiBase: null,
            error: null,
            isLoadingAuth: false
          });
          return;
        }

        setOAuthSession(res);
        setAuthState((prev) => ({ ...prev, isLoadingAuth: false }));
      })
      .catch((err) => {
        if (isCancelled) return;
        const e = err instanceof Error ? err : new Error(String(err));
        setAuthState((prev) => ({
          ...prev,
          isLoadingAuth: false,
          error: e
        }));
      });

    return () => {
      isCancelled = true;
    };
  }, [props.tokenProvider]);

  const setOAuthSession = (session: ZorveusOAuthSessionPayload) => {
    const newState: ZorveusAuthState = {
      isConnected: true,
      accessToken: session.access_token,
      appConnectionId: session.app_connection_id || null,
      apiBase: session.api_base || null,
      error: null,
      isLoadingAuth: false
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
      error: null,
      isLoadingAuth: false
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

  // Create memoized OpenAI adapter client configured for Zorveus Gateway
  const openAIClient = useMemo(() => {
    const keyToUse = authState.accessToken || inferenceKey;
    if (!keyToUse) return null;

    try {
      return new ZorveusOpenAI({
        apiKey: keyToUse,
        baseURL: authState.apiBase || resolvedGatewayBaseURL,
        dangerouslyAllowBrowser: true
      });
    } catch {
      return null;
    }
  }, [authState.accessToken, authState.apiBase, inferenceKey, resolvedGatewayBaseURL]);

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
    openAIClient,
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
