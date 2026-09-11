import type { ZorveusMetadata } from "./chat";

export type AudioVoice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" | string;
export type AudioResponseFormat = "mp3" | "opus" | "aac" | "flac" | "wav" | "pcm";

export interface AudioSpeechCreateParams {
  /**
   * One of the available TTS models (e.g. "tts-1" or "tts-1-hd").
   */
  model: string;

  /**
   * The text to generate audio for.
   */
  input: string;

  /**
   * The voice to use when generating the audio.
   */
  voice: AudioVoice;

  /**
   * The format in which the audio is returned.
   * @default "mp3"
   */
  response_format?: AudioResponseFormat;

  /**
   * The speed of the generated audio, between 0.25 and 4.0.
   * @default 1.0
   */
  speed?: number;

  /**
   * High-level Zorveus end-user attribution metadata.
   */
  zorveusMetadata?: ZorveusMetadata;

  /**
   * Explicit metadata passed directly to the Zorveus Gateway.
   */
  metadata?: Record<string, unknown>;
}

export interface AudioTranscriptionCreateParams {
  /**
   * The audio file object (e.g. Blob, File) to transcribe.
   */
  file: Blob | File | any;

  /**
   * ID of the model to use (e.g. "whisper-1").
   */
  model: string;

  /**
   * The language of the input audio in ISO-639-1 format.
   */
  language?: string;

  /**
   * Optional text prompt to guide the model's style.
   */
  prompt?: string;

  /**
   * The format of the transcript output.
   * @default "json"
   */
  response_format?: "json" | "text" | "srt" | "verbose_json" | "vtt";

  /**
   * The sampling temperature, between 0 and 1.
   */
  temperature?: number;

  /**
   * The timestamp granularities to populate.
   */
  timestamp_granularities?: Array<"word" | "segment">;

  /**
   * High-level Zorveus end-user attribution metadata.
   */
  zorveusMetadata?: ZorveusMetadata;

  /**
   * Explicit metadata passed directly to the Zorveus Gateway.
   */
  metadata?: Record<string, unknown>;
}

export interface AudioTranscription {
  text: string;
  task?: string;
  language?: string;
  duration?: number;
  words?: Array<{ word: string; start: number; end: number }>;
  segments?: Array<{
    id: number;
    seek: number;
    start: number;
    end: number;
    text: string;
    tokens: number[];
    temperature: number;
    avg_logprob: number;
    compression_ratio: number;
    no_speech_prob: number;
  }>;
}
