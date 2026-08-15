export type ProviderCredentialStatus = "active" | "disabled" | "invalid";
export type ProviderCredentialRoutingMode = "auto_resolve" | "manual";
export type ProviderCredentialSecretKind = "api_key" | "service_account" | "oauth_token";

export interface ProviderCredentialResponse {
  provider_credential_id: string;
  org_id: string;
  provider: string;
  credential_name: string;
  status: ProviderCredentialStatus;
  routing_mode: ProviderCredentialRoutingMode;
  routing_priority: number;
  default_model_policy: string[];
  provider_config: Record<string, unknown> | null;
  active_secret_version_id: string | null;
  secret_fingerprint: string | null;
  last_validated_at: string | null;
  last_used_at: string | null;
}

export type ProviderCredential = ProviderCredentialResponse;

export interface ProviderCredentialListResponse {
  provider_credentials: ProviderCredentialResponse[];
}

export interface RotateProviderCredentialResponse {
  provider_credential: ProviderCredentialResponse;
  rotated: boolean;
}

export interface ProviderCredentialProviderInfo {
  provider: string;
  display_name: string;
  supported_auth_types: string[];
  docs_url?: string;
}

export interface ProviderCredentialProviderCatalogResponse {
  providers: ProviderCredentialProviderInfo[];
}

export interface CreateProviderCredentialParams {
  orgId?: string;
  provider: string;
  credentialName: string;
  apiKey: string;
  secretKind?: ProviderCredentialSecretKind;
  modelPolicies?: string[];
  providerConfig?: Record<string, unknown> | null;
  routingMode?: ProviderCredentialRoutingMode;
  routingPriority?: number;
}

export interface RotateProviderCredentialParams {
  orgId?: string;
  apiKey: string;
  secretKind?: ProviderCredentialSecretKind;
}

export interface ListProviderCredentialsParams {
  orgId?: string;
  status?: string;
}
