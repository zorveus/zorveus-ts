export type ChatCompletionRole = "system" | "user" | "assistant" | "tool" | "function";

export interface ChatMessageToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatMessage {
  role: ChatCompletionRole;
  content: string | null;
  name?: string;
  tool_call_id?: string;
  tool_calls?: ChatMessageToolCall[];
}

export interface ChatCompletionTool {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
}

export interface ZorveusMetadata {
  /**
   * The startup's external customer ID (e.g. "usr_ext_8842").
   */
  externalUserId?: string;

  /**
   * Customer's display name.
   */
  displayName?: string;

  /**
   * Customer's email.
   */
  userEmail?: string;

  /**
   * Custom metadata key-value pairs (e.g. `{ plan: "pro", teamId: "team_402" }`).
   */
  metadata?: Record<string, unknown>;
}

export interface ZorveusGatewayProductUserMetadata {
  display_name?: string | null;
  email?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface ZorveusGatewayMetadata {
  external_user_id?: string;
  product_user?: ZorveusGatewayProductUserMetadata;
}

/**
 * Formats SDK metadata into Gateway request body contract format.
 */
export function formatGatewayMetadata(
  meta?: ZorveusMetadata
): ZorveusGatewayMetadata | undefined {
  if (!meta) return undefined;

  const result: ZorveusGatewayMetadata = {};

  if (meta.externalUserId) {
    result.external_user_id = meta.externalUserId;
  }

  if (meta.displayName !== undefined || meta.userEmail !== undefined || meta.metadata !== undefined) {
    result.product_user = {
      display_name: meta.displayName ?? null,
      email: meta.userEmail ?? null,
      metadata: meta.metadata ?? null
    };
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

export interface ChatCompletionCreateParamsBase {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  top_p?: number;
  n?: number;
  max_tokens?: number;
  max_completion_tokens?: number;
  stop?: string | string[];
  presence_penalty?: number;
  frequency_penalty?: number;
  logit_bias?: Record<string, number>;
  user?: string;
  tools?: ChatCompletionTool[];
  tool_choice?: "none" | "auto" | "required" | { type: "function"; function: { name: string } };
  response_format?: { type: "text" | "json_object" | "json_schema"; json_schema?: Record<string, unknown> };
  seed?: number;

  /**
   * Inline Zorveus product-user metadata attribution.
   */
  zorveusMetadata?: ZorveusMetadata;

  /**
   * Gateway request body metadata payload override.
   */
  metadata?: Record<string, unknown>;
}

export interface ChatCompletionCreateParamsNonStreaming extends ChatCompletionCreateParamsBase {
  stream?: false;
}

export interface ChatCompletionCreateParamsStreaming extends ChatCompletionCreateParamsBase {
  stream: true;
}

export type ChatCompletionCreateParams =
  | ChatCompletionCreateParamsNonStreaming
  | ChatCompletionCreateParamsStreaming;

export interface ChatCompletionChoice {
  index: number;
  message: ChatMessage;
  finish_reason: "stop" | "length" | "tool_calls" | "content_filter" | "function_call" | null;
  logprobs?: unknown;
}

export interface ChatCompletionChunkChoiceDelta {
  role?: ChatCompletionRole;
  content?: string | null;
  tool_calls?: Array<{
    index: number;
    id?: string;
    type?: "function";
    function?: {
      name?: string;
      arguments?: string;
    };
  }>;
}

export interface ChatCompletionChunkChoice {
  index: number;
  delta: ChatCompletionChunkChoiceDelta;
  finish_reason: "stop" | "length" | "tool_calls" | "content_filter" | "function_call" | null;
  logprobs?: unknown;
}

export interface ChatCompletionUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  prompt_tokens_details?: {
    cached_tokens?: number;
  };
  completion_tokens_details?: {
    reasoning_tokens?: number;
  };
}

export interface ChatCompletion {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage?: ChatCompletionUsage;
  system_fingerprint?: string;
}

export interface ChatCompletionChunk {
  id: string;
  object: "chat.completion.chunk";
  created: number;
  model: string;
  choices: ChatCompletionChunkChoice[];
  usage?: ChatCompletionUsage;
  system_fingerprint?: string;
}
