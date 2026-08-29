import { createOpenAI, type OpenAIProvider } from "@ai-sdk/openai";

export interface ZorveusVercelOptions {
  apiKey?: string;
  baseURL?: string;
  externalUserId?: string;
  displayName?: string;
  userEmail?: string;
  email?: string;
  userMetadata?: Record<string, unknown>;
  appId?: string;
  metadata?: Record<string, unknown>;
  headers?: Record<string, string>;
  fetch?: typeof globalThis.fetch;
}

/**
 * Creates a Vercel AI SDK provider instance configured for Zorveus AI Gateway,
 * automatically injecting metadata (external_user_id and product_user attribution) into request payloads.
 */
export function createZorveus(options: ZorveusVercelOptions = {}): OpenAIProvider {
  const apiKey = options.apiKey ?? process.env.ZORVEUS_INFERENCE_KEY;
  if (!apiKey) {
    throw new Error("Zorveus API key is required. Set ZORVEUS_INFERENCE_KEY or pass apiKey.");
  }

  const baseFetch = options.fetch ?? globalThis.fetch;

  const customFetch: typeof globalThis.fetch = async (url, init) => {
    if (init?.body && typeof init.body === "string") {
      try {
        const bodyObj = JSON.parse(init.body);

        const extId = bodyObj.external_user_id ?? options.externalUserId;
        const dName = bodyObj.display_name ?? options.displayName;
        const uEmail = bodyObj.user_email ?? bodyObj.email ?? options.userEmail ?? options.email;
        const uMeta = bodyObj.user_metadata ?? options.userMetadata;
        const aId = bodyObj.app_id ?? options.appId;

        const productUser = {
          ...(dName ? { display_name: dName } : {}),
          ...(uEmail ? { email: uEmail } : {}),
          ...(uMeta ? { metadata: uMeta } : {}),
          ...bodyObj.metadata?.product_user
        };

        const merged = {
          ...(extId ? { external_user_id: extId } : {}),
          ...(aId ? { app_id: aId } : {}),
          ...(Object.keys(productUser).length > 0 ? { product_user: productUser } : {}),
          ...options.metadata,
          ...bodyObj.metadata
        };

        if (Object.keys(merged).length > 0) {
          bodyObj.metadata = merged;
          init = { ...init, body: JSON.stringify(bodyObj) };
        }
      } catch {
        // Ignore non-JSON request body
      }
    }
    return baseFetch(url, init);
  };

  return createOpenAI({
    apiKey,
    baseURL: options.baseURL ?? process.env.ZORVEUS_GATEWAY_URL ?? "https://api.zorveus.com/v1",
    headers: options.headers,
    fetch: customFetch
  });
}
