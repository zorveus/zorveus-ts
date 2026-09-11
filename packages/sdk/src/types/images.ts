import type { ZorveusMetadata } from "./chat";

export interface ImageGenerateParams {
  /**
   * A text description of the desired image(s).
   */
  prompt: string;

  /**
   * The model to use for image generation.
   */
  model?: string;

  /**
   * The number of images to generate.
   */
  n?: number;

  /**
   * The quality of the image that will be generated.
   */
  quality?: "standard" | "hd";

  /**
   * The format in which the generated images are returned.
   */
  response_format?: "url" | "b64_json";

  /**
   * The size of the generated images.
   */
  size?: "256x256" | "512x512" | "1024x1024" | "1792x1024" | "1024x1792" | string;

  /**
   * The style of the generated images.
   */
  style?: "vivid" | "natural";

  /**
   * A unique identifier representing your end-user.
   */
  user?: string;

  /**
   * High-level Zorveus end-user attribution metadata.
   */
  zorveusMetadata?: ZorveusMetadata;

  /**
   * Explicit metadata passed directly to the Zorveus Gateway.
   */
  metadata?: Record<string, unknown>;
}

export interface Image {
  b64_json?: string;
  url?: string;
  revised_prompt?: string;
}

export interface ImagesResponse {
  created: number;
  data: Image[];
}
