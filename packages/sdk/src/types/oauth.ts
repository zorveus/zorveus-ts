export interface PKCEData {
  /**
   * High-entropy cryptographic random string (43-128 chars).
   */
  codeVerifier: string;

  /**
   * Base64URL-encoded SHA-256 hash of the code_verifier.
   */
  codeChallenge: string;

  /**
   * Cryptographically secure random state parameter for CSRF protection.
   */
  state: string;
}

export interface AuthorizationUrlParams {
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
  scopes?: string[] | string;
  baseURL?: string;
}

export interface TokenExchangeParams {
  clientId: string;
  clientSecret?: string;
  code: string;
  codeVerifier: string;
  redirectUri: string;
  baseURL?: string;
}

export interface TokenRevocationParams {
  token: string;
  clientId?: string;
  clientSecret?: string;
  baseURL?: string;
}

export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number | null;
  scope: string;
  app_connection_id: string;
  api_base: string;
}

export interface CallbackValidationOptions {
  urlOrParams: string | URLSearchParams | Record<string, string>;
  expectedState?: string;
}

export interface CallbackValidationResult {
  valid: boolean;
  code?: string;
  state?: string;
  error?: string;
  errorDescription?: string;
}
