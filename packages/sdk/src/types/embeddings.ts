import type { ZorveusMetadata } from "./chat";

export interface EmbeddingCreateParams {
  model: string;
  input: string | string[] | number[] | number[][];
  encoding_format?: "float" | "base64";
  dimensions?: number;
  user?: string;

  /**
   * Inline Zorveus product-user metadata attribution.
   */
  zorveusMetadata?: ZorveusMetadata;
}

export interface EmbeddingData {
  index: number;
  object: "embedding";
  embedding: number[];
}

export interface EmbeddingUsage {
  prompt_tokens: number;
  total_tokens: number;
}

export interface EmbeddingCreateResponse {
  object: "list";
  data: EmbeddingData[];
  model: string;
  usage: EmbeddingUsage;
}
