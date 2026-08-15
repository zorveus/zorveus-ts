import { generateRandomString, sha256Base64Url } from "./utils/crypto";
import { createAPIError } from "./errors/zorveus-error";
import type {
  PKCEData,
  AuthorizationUrlParams,
  TokenExchangeParams,
  TokenRevocationParams,
  OAuthTokenResponse,
  CallbackValidationOptions,
  CallbackValidationResult
} from "./types/oauth";

/**
 * Isomorphic OAuth PKCE and token management utilities for Zorveus.
 */
export class ZorveusOAuth {
  /**
   * Generates an RFC 7636 PKCE code_verifier, code_challenge (S256), and CSRF state parameter.
   */
  static async generatePKCE(byteLength = 32): Promise<PKCEData> {
    const codeVerifier = generateRandomString(byteLength);
    const codeChallenge = await sha256Base64Url(codeVerifier);
    const state = generateRandomString(32);

    return {
      codeVerifier,
      codeChallenge,
      state
    };
  }

  /**
   * Constructs the Zorveus OAuth PKCE consent URL.
   */
  static getAuthorizationUrl(params: AuthorizationUrlParams): string {
    const baseUrl = (params.baseURL || "https://api.zorveus.com").replace(/\/+$/, "");
    const url = new URL(`${baseUrl}/oauth/authorize`);

    url.searchParams.set("client_id", params.clientId);
    url.searchParams.set("redirect_uri", params.redirectUri);
    url.searchParams.set("state", params.state);
    url.searchParams.set("code_challenge", params.codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("response_type", "code");

    const scopes = params.scopes
      ? Array.isArray(params.scopes) ? params.scopes.join(" ") : params.scopes
      : "inference:write models:*";

    url.searchParams.set("scope", scopes);

    return url.toString();
  }

  /**
   * Validates OAuth redirect parameters against expected CSRF state.
   */
  static validateCallback(options: CallbackValidationOptions): CallbackValidationResult {
    let params: URLSearchParams;

    if (typeof options.urlOrParams === "string") {
      const urlStr = options.urlOrParams;
      const queryIdx = urlStr.indexOf("?");
      const search = queryIdx !== -1 ? urlStr.slice(queryIdx) : urlStr;
      params = new URLSearchParams(search);
    } else if (options.urlOrParams instanceof URLSearchParams) {
      params = options.urlOrParams;
    } else if (options.urlOrParams && typeof options.urlOrParams === "object") {
      params = new URLSearchParams();
      for (const [key, value] of Object.entries(options.urlOrParams)) {
        if (value !== undefined && value !== null && value !== "undefined" && value !== "null") {
          params.set(key, String(value));
        }
      }
    } else {
      params = new URLSearchParams();
    }

    const rawError = params.get("error");
    const isRealError = rawError && rawError !== "undefined" && rawError !== "null";
    if (isRealError) {
      const rawDesc = params.get("error_description");
      const errorDescription = rawDesc && rawDesc !== "undefined" && rawDesc !== "null" ? rawDesc : undefined;
      return {
        valid: false,
        error: rawError,
        errorDescription
      };
    }

    const rawCode = params.get("code");
    const code = rawCode && rawCode !== "undefined" && rawCode !== "null" ? rawCode : undefined;
    if (!code) {
      return {
        valid: false,
        error: "invalid_response",
        errorDescription: "Missing authorization code in redirect params"
      };
    }

    const rawState = params.get("state");
    const state = rawState && rawState !== "undefined" && rawState !== "null" ? rawState : undefined;
    if (options.expectedState && state !== options.expectedState) {
      return {
        valid: false,
        error: "state_mismatch",
        errorDescription: "State parameter does not match expected CSRF token"
      };
    }

    return {
      valid: true,
      code,
      state
    };
  }

  /**
   * Exchanges an OAuth authorization code for a Zorveus inference key using application/x-www-form-urlencoded.
   */
  static async exchangeToken(params: TokenExchangeParams): Promise<OAuthTokenResponse> {
    const baseUrl = (params.baseURL || "https://api.zorveus.com").replace(/\/+$/, "");
    const url = `${baseUrl}/oauth/token`;

    const bodyParams = new URLSearchParams();
    bodyParams.append("grant_type", "authorization_code");
    bodyParams.append("client_id", params.clientId);
    bodyParams.append("code", params.code);
    bodyParams.append("code_verifier", params.codeVerifier);
    bodyParams.append("redirect_uri", params.redirectUri);

    if (params.clientSecret) {
      bodyParams.append("client_secret", params.clientSecret);
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json"
    };

    if (typeof window === "undefined") {
      headers["User-Agent"] = "@zorveus/sdk/0.1.0";
    }

    console.log("[ZorveusOAuth.exchangeToken] Request details:", {
      url,
      grant_type: "authorization_code",
      client_id: params.clientId,
      code_length: params.code?.length,
      code_verifier_length: params.codeVerifier?.length,
      redirect_uri: params.redirectUri,
      has_client_secret: Boolean(params.clientSecret)
    });

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: bodyParams.toString()
    });

    if (!response.ok) {
      let errorBody: unknown;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }

      console.error("[ZorveusOAuth.exchangeToken] Server returned error:", {
        status: response.status,
        statusText: response.statusText,
        errorBody,
        requestParams: {
          client_id: params.clientId,
          redirect_uri: params.redirectUri,
          code: params.code ? `${params.code.slice(0, 10)}...` : undefined,
          code_verifier: params.codeVerifier ? `${params.codeVerifier.slice(0, 10)}...` : undefined
        }
      });

      throw createAPIError(response.status, errorBody);
    }

    const tokenData = (await response.json()) as OAuthTokenResponse;
    console.log("[ZorveusOAuth.exchangeToken] Token exchange successful:", {
      token_type: tokenData.token_type,
      scope: tokenData.scope,
      app_connection_id: tokenData.app_connection_id,
      expires_in: tokenData.expires_in
    });

    return tokenData;
  }

  /**
   * Revokes an existing OAuth token or app connection using application/x-www-form-urlencoded.
   */
  static async revokeToken(params: TokenRevocationParams): Promise<void> {
    const baseUrl = (params.baseURL || "https://api.zorveus.com").replace(/\/+$/, "");
    const url = `${baseUrl}/oauth/revoke`;

    const bodyParams = new URLSearchParams();
    bodyParams.append("token", params.token);

    if (params.clientId) {
      bodyParams.append("client_id", params.clientId);
    }

    if (params.clientSecret) {
      bodyParams.append("client_secret", params.clientSecret);
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json"
    };

    if (typeof window === "undefined") {
      headers["User-Agent"] = "@zorveus/sdk/0.1.0";
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: bodyParams.toString()
    });

    if (!response.ok) {
      let errorBody: unknown;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }
      throw createAPIError(response.status, errorBody);
    }
  }
}
