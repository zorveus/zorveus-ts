import type { HTTPTransport } from "../http/transport";
import type { RequestOptions } from "../types/client";
import type {
  CreateProviderCredentialParams,
  ProviderCredentialResponse,
  ProviderCredentialListResponse,
  ListProviderCredentialsParams,
  RotateProviderCredentialParams,
  RotateProviderCredentialResponse,
  ProviderCredentialProviderCatalogResponse
} from "../types/provider-credentials";

export class ProviderCredentials {
  private readonly transport: HTTPTransport;

  constructor(transport: HTTPTransport) {
    this.transport = transport;
  }

  /**
   * Registers an organization BYOK provider credential via Service Key (`POST /provider-credentials`).
   */
  async create(
    params: CreateProviderCredentialParams,
    options: RequestOptions = {}
  ): Promise<ProviderCredentialResponse> {
    const payload = {
      provider: params.provider,
      credential_name: params.credentialName,
      secret: params.apiKey,
      api_key: params.apiKey,
      secret_kind: params.secretKind || "api_key",
      model_policies: params.modelPolicies || [],
      provider_config: params.providerConfig ?? null,
      routing_mode: params.routingMode || "auto_resolve",
      routing_priority: params.routingPriority ?? 100
    };

    const query = params.orgId ? { org_id: params.orgId } : undefined;

    return this.transport.request<ProviderCredentialResponse>(
      "/provider-credentials/org-programmatic",
      {
        method: "POST",
        body: payload,
        query,
        ...options
      }
    );
  }

  /**
   * Lists BYOK provider credentials for an organization (`GET /provider-credentials`).
   */
  async list(
    params: ListProviderCredentialsParams = {},
    options: RequestOptions = {}
  ): Promise<ProviderCredentialListResponse> {
    const query: Record<string, unknown> = {};
    if (params.orgId) query.org_id = params.orgId;
    if (params.status) query.status = params.status;

    return this.transport.request<ProviderCredentialListResponse>(
      "/provider-credentials/org-programmatic",
      {
        method: "GET",
        query,
        ...options
      }
    );
  }

  /** Retrieves one BYOK provider credential by ID. */
  async get(
    providerCredentialId: string,
    options: RequestOptions = {}
  ): Promise<ProviderCredentialResponse> {
    return this.transport.request<ProviderCredentialResponse>(
      `/provider-credentials/org-programmatic/${encodeURIComponent(providerCredentialId)}`,
      { method: "GET", ...options }
    );
  }

  /**
   * Rotates a provider credential secret (`POST /provider-credentials/org-programmatic/{id}/rotate`).
   */
  async rotate(
    providerCredentialId: string,
    params: RotateProviderCredentialParams,
    options: RequestOptions = {}
  ): Promise<RotateProviderCredentialResponse> {
    const payload = {
      api_key: params.apiKey,
      secret_kind: params.secretKind || "api_key"
    };

    const query = params.orgId ? { org_id: params.orgId } : undefined;

    return this.transport.request<RotateProviderCredentialResponse>(
      `/provider-credentials/org-programmatic/${encodeURIComponent(providerCredentialId)}/rotate`,
      {
        method: "POST",
        body: payload,
        query,
        ...options
      }
    );
  }

  /**
   * Deletes a provider credential (`DELETE /provider-credentials/org-programmatic/{id}`).
   */
  async delete(
    providerCredentialId: string,
    options: RequestOptions = {}
  ): Promise<void> {
    return this.transport.request<void>(
      `/provider-credentials/org-programmatic/${encodeURIComponent(providerCredentialId)}`,
      {
        method: "DELETE",
        ...options
      }
    );
  }

  /**
   * Lists supported AI provider catalog (`GET /provider-credentials/providers`).
   */
  async listProviders(
    options: RequestOptions = {}
  ): Promise<ProviderCredentialProviderCatalogResponse> {
    return this.transport.request<ProviderCredentialProviderCatalogResponse>(
      "/provider-credentials/providers",
      {
        method: "GET",
        ...options
      }
    );
  }
}
