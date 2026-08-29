import OpenAI from "openai";

export interface ZorveusOpenAIOptions {
  apiKey?: string;
  baseURL?: string;
  externalUserId?: string;
  displayName?: string;
  userEmail?: string;
  email?: string;
  userMetadata?: Record<string, unknown>;
  appId?: string;
  metadata?: Record<string, unknown>;
  defaultHeaders?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * ZorveusOpenAI wraps the official OpenAI SDK client, automatically injecting
 * metadata (external_user_id and product_user attribution) into request payloads.
 */
export class ZorveusOpenAI extends OpenAI {
  private readonly defaultExternalUserId?: string;
  private readonly defaultDisplayName?: string;
  private readonly defaultUserEmail?: string;
  private readonly defaultUserMetadata?: Record<string, unknown>;
  private readonly defaultAppId?: string;
  private readonly defaultMetadata?: Record<string, unknown>;

  constructor(options: ZorveusOpenAIOptions = {}) {
    const apiKey = options.apiKey ?? process.env.ZORVEUS_INFERENCE_KEY;
    if (!apiKey) {
      throw new Error("Zorveus API key is required. Set ZORVEUS_INFERENCE_KEY or pass apiKey.");
    }

    const {
      externalUserId,
      displayName,
      userEmail,
      email,
      userMetadata,
      appId,
      metadata,
      baseURL,
      defaultHeaders,
      ...restOptions
    } = options;

    super({
      apiKey,
      baseURL: baseURL ?? process.env.ZORVEUS_GATEWAY_URL ?? "https://api.zorveus.com/v1",
      defaultHeaders,
      ...restOptions
    });

    this.defaultExternalUserId = externalUserId;
    this.defaultDisplayName = displayName;
    this.defaultUserEmail = userEmail || email;
    this.defaultUserMetadata = userMetadata;
    this.defaultAppId = appId;
    this.defaultMetadata = metadata;

    const buildMetadata = (body: any) => {
      const extId = body?.external_user_id ?? this.defaultExternalUserId;
      const dName = body?.display_name ?? this.defaultDisplayName;
      const uEmail = body?.user_email ?? body?.email ?? this.defaultUserEmail;
      const uMeta = body?.user_metadata ?? this.defaultUserMetadata;
      const aId = body?.app_id ?? this.defaultAppId;

      const productUser = {
        ...(dName ? { display_name: dName } : {}),
        ...(uEmail ? { email: uEmail } : {}),
        ...(uMeta ? { metadata: uMeta } : {}),
        ...body?.metadata?.product_user
      };

      const merged = {
        ...(extId ? { external_user_id: extId } : {}),
        ...(aId ? { app_id: aId } : {}),
        ...(Object.keys(productUser).length > 0 ? { product_user: productUser } : {}),
        ...this.defaultMetadata,
        ...body?.metadata
      };

      return Object.keys(merged).length > 0 ? merged : undefined;
    };

    const originalCreate = this.chat.completions.create.bind(this.chat.completions);

    this.chat.completions.create = ((body: any, requestOptions?: any) => {
      const mergedMetadata = buildMetadata(body);
      const updatedBody = {
        ...body,
        ...(mergedMetadata ? { metadata: mergedMetadata } : {})
      };

      return originalCreate(updatedBody, requestOptions);
    }) as any;

    if (this.responses && typeof (this.responses as any).create === "function") {
      const originalResponsesCreate = (this.responses as any).create.bind(this.responses);

      (this.responses as any).create = ((body: any, requestOptions?: any) => {
        const mergedMetadata = buildMetadata(body);
        const updatedBody = {
          ...body,
          ...(mergedMetadata ? { metadata: mergedMetadata } : {})
        };

        return originalResponsesCreate(updatedBody, requestOptions);
      }) as any;
    }
  }
}
