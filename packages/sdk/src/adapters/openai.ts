import OpenAI from "openai";
export { parseZorveusGatewayError } from "../errors/zorveus-error";

export interface ZorveusOpenAIOptions {
  apiKey?: string;
  baseURL?: string;
  externalUserId?: string;
  productEndUserId?: string;
  displayName?: string;
  userEmail?: string;
  email?: string;
  userMetadata?: Record<string, unknown>;
  appId?: string;
  metadata?: Record<string, unknown>;
  defaultHeaders?: Record<string, string>;
  [key: string]: unknown;
}

interface AttributionDefaults {
  externalUserId?: string;
  productEndUserId?: string;
  displayName?: string;
  userEmail?: string;
  userMetadata?: Record<string, unknown>;
  appId?: string;
  metadata?: Record<string, unknown>;
}

function objectValue(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, any>
    : {};
}

function buildAttributionMetadata(
  body: Record<string, any>,
  defaults: AttributionDefaults
): Record<string, unknown> | undefined {
  const requestMetadata = objectValue(body.metadata);
  const externalUserId =
    body.user ?? body.external_user_id ?? requestMetadata.external_user_id ?? defaults.externalUserId;
  const productEndUserId =
    body.product_end_user_id ?? requestMetadata.product_end_user_id ?? defaults.productEndUserId;
  const displayName = body.display_name ?? defaults.displayName;
  const userEmail = body.user_email ?? body.email ?? defaults.userEmail;
  const userMetadata = body.user_metadata ?? defaults.userMetadata;
  const appId = body.app_id ?? defaults.appId;
  const requestProductUser = objectValue(requestMetadata.product_user);

  const productUser = {
    ...(displayName ? { display_name: displayName } : {}),
    ...(userEmail ? { email: userEmail } : {}),
    ...(userMetadata ? { metadata: userMetadata } : {}),
    ...requestProductUser
  };
  const metadata = {
    ...(externalUserId ? { external_user_id: externalUserId } : {}),
    ...(productEndUserId ? { product_end_user_id: productEndUserId } : {}),
    ...(appId ? { app_id: appId } : {}),
    ...(Object.keys(productUser).length > 0 ? { product_user: productUser } : {}),
    ...defaults.metadata,
    ...requestMetadata
  };

  return Object.keys(metadata).length > 0 ? metadata : undefined;
}

function parseFormMetadata(value: FormDataEntryValue | null): Record<string, unknown> {
  if (typeof value !== "string" || !value) return {};
  try {
    return objectValue(JSON.parse(value));
  } catch {
    return {};
  }
}

function createAttributionFetch(
  baseFetch: typeof globalThis.fetch,
  defaults: AttributionDefaults
): typeof globalThis.fetch {
  return async (url, init) => {
    if (typeof init?.body === "string") {
      try {
        const body = objectValue(JSON.parse(init.body));
        const metadata = buildAttributionMetadata(body, defaults);
        if (metadata) init = { ...init, body: JSON.stringify({ ...body, metadata }) };
      } catch {
        // Non-JSON request bodies pass through unchanged.
      }
    } else if (init?.body instanceof FormData) {
      const form = init.body;
      const body = {
        user: form.get("user"),
        external_user_id: form.get("external_user_id"),
        product_end_user_id: form.get("product_end_user_id"),
        metadata: parseFormMetadata(form.get("metadata"))
      };
      const metadata = buildAttributionMetadata(body, defaults);
      if (metadata) form.set("metadata", JSON.stringify(metadata));
    }

    return baseFetch(url, init);
  };
}

/**
 * OpenAI client configured for Zorveus with attribution on JSON and multipart requests.
 */
export class ZorveusOpenAI extends OpenAI {
  constructor(options: ZorveusOpenAIOptions = {}) {
    const apiKey = options.apiKey ?? process.env.ZORVEUS_INFERENCE_KEY;
    if (!apiKey) {
      throw new Error("Zorveus API key is required. Set ZORVEUS_INFERENCE_KEY or pass apiKey.");
    }

    const {
      externalUserId,
      productEndUserId,
      displayName,
      userEmail,
      email,
      userMetadata,
      appId,
      metadata,
      baseURL,
      defaultHeaders,
      fetch: suppliedFetch,
      ...restOptions
    } = options;

    const defaults: AttributionDefaults = {
      externalUserId,
      productEndUserId,
      displayName,
      userEmail: userEmail || email,
      userMetadata,
      appId,
      metadata
    };
    const baseFetch = suppliedFetch as typeof globalThis.fetch | undefined;

    super({
      apiKey,
      baseURL: baseURL ?? process.env.ZORVEUS_GATEWAY_URL ?? "https://api.zorveus.com/v1",
      defaultHeaders,
      fetch: createAttributionFetch(baseFetch ?? globalThis.fetch.bind(globalThis), defaults),
      ...restOptions
    });
  }
}
