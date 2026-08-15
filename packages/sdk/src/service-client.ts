import { HTTPTransport } from "./http/transport";
import { ProductUsers } from "./resources/product-users";
import { ProviderCredentials } from "./resources/provider-credentials";
import type { ZorveusServiceClientOptions } from "./types/client";

/**
 * Zorveus Service Client (Server-to-Server Management Control Plane).
 * Authenticated via Organization Service Key (`zrv_service_...`).
 * WARNING: Never export or use this client in browser applications.
 */
export class ZorveusServiceClient {
  readonly productUsers: ProductUsers;
  readonly providerCredentials: ProviderCredentials;
  protected readonly transport: HTTPTransport;

  constructor(options: ZorveusServiceClientOptions) {
    if (!options || !options.apiKey) {
      throw new Error(
        "ZorveusServiceClient requires an 'apiKey' (Organization Service Key 'zrv_service_...')."
      );
    }

    const baseURL = (options.baseURL || "https://api.zorveus.com").replace(/\/+$/, "");

    this.transport = new HTTPTransport({
      apiKey: options.apiKey,
      baseURL,
      timeout: options.timeout,
      maxRetries: options.maxRetries,
      defaultHeaders: options.defaultHeaders,
      fetch: options.fetch
    });

    this.productUsers = new ProductUsers(this.transport);
    this.providerCredentials = new ProviderCredentials(this.transport);
  }
}
