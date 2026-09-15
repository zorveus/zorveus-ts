import type OpenAI from "openai";
import { Videos } from "openai/resources/videos";
import type { Video, VideoCreateParams } from "openai/resources/videos";

export const ACTIVE_VIDEO_STATUSES = new Set(["queued", "in_progress", "processing"]);

export type ZorveusVideoCreateParams = VideoCreateParams & {
  metadata?: Record<string, unknown>;
};

export interface VideoPollOptions {
  /** Delay between status requests. Defaults to 1 second. */
  pollIntervalMs?: number;
  /** Maximum time spent creating and polling the job. */
  timeoutMs?: number;
  /** Cancels creation, polling waits, and status requests. */
  signal?: AbortSignal;
}

function abortReason(signal: AbortSignal): unknown {
  return signal.reason ?? new Error("Video generation polling was cancelled.");
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.reject(abortReason(signal));

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timeout);
      reject(abortReason(signal!));
    };

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/** OpenAI-compatible video resource with provider-neutral polling. */
export class ZorveusVideosResource extends Videos {
  override create(body: ZorveusVideoCreateParams, options?: OpenAI.RequestOptions) {
    return super.create(body as VideoCreateParams, options);
  }

  async createAndPoll(
    params: ZorveusVideoCreateParams,
    options: VideoPollOptions = {}
  ): Promise<Video> {
    const pollIntervalMs = options.pollIntervalMs ?? 1_000;
    if (!Number.isFinite(pollIntervalMs) || pollIntervalMs < 0) {
      throw new RangeError("pollIntervalMs must be a non-negative finite number.");
    }
    if (options.timeoutMs !== undefined &&
        (!Number.isFinite(options.timeoutMs) || options.timeoutMs < 0)) {
      throw new RangeError("timeoutMs must be a non-negative finite number.");
    }

    const deadline = options.timeoutMs === undefined ? undefined : Date.now() + options.timeoutMs;
    let video = await this.create(params, { signal: options.signal });

    while (ACTIVE_VIDEO_STATUSES.has(video.status as string)) {
      const remaining = deadline === undefined ? undefined : deadline - Date.now();
      if (remaining !== undefined && remaining <= 0) {
        throw new Error(`Video generation timed out after ${options.timeoutMs}ms.`);
      }

      await wait(remaining === undefined ? pollIntervalMs : Math.min(pollIntervalMs, remaining), options.signal);
      if (deadline !== undefined && Date.now() >= deadline) {
        throw new Error(`Video generation timed out after ${options.timeoutMs}ms.`);
      }
      video = await this.retrieve(video.id, { signal: options.signal });
    }

    return video;
  }
}
