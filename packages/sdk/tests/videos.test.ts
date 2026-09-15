import { describe, expect, it, vi } from "vitest";
import { ZorveusOpenAI } from "../src/adapters/openai";

function video(id: string, status: string, error: unknown = null) {
  return {
    id,
    status,
    error,
    object: "video",
    created_at: 1,
    completed_at: status === "completed" ? 2 : null,
    expires_at: null,
    model: "gemini/veo-3.1-lite-generate-preview",
    progress: status === "completed" ? 100 : 50,
    prompt: "test",
    remixed_from_video_id: null,
    seconds: "4",
    size: "1280x720"
  };
}

describe("Zorveus OpenAI video support", () => {
  function videoRequests(fetch: ReturnType<typeof vi.fn>): unknown[][] {
    return fetch.mock.calls.filter(([url]) => String(url).includes("/videos"));
  }

  it("adds attribution while preserving caller metadata", async () => {
    let metadata: Record<string, unknown> | undefined;
    const fetch = vi.fn(async (_url, init) => {
      const form = init?.body as FormData;
      metadata = JSON.parse(String(form.get("metadata")));
      return Response.json(video("vid_1", "completed"));
    });
    const client = new ZorveusOpenAI({
      apiKey: "zrv_test",
      externalUserId: "customer_123",
      productEndUserId: "peu_456",
      fetch
    });

    await client.videos.create({
      model: "gemini/veo-3.1-lite-generate-preview",
      prompt: "A paper airplane",
      metadata: { trace_id: "trace_123", external_user_id: "caller_override" }
    });

    expect(metadata).toEqual({
      external_user_id: "caller_override",
      product_end_user_id: "peu_456",
      trace_id: "trace_123"
    });
  });

  it("polls processing jobs until they complete", async () => {
    const statuses = ["processing", "processing", "completed"];
    const fetch = vi.fn(async () => Response.json(video("vid_2", statuses.shift()!)));
    const client = new ZorveusOpenAI({ apiKey: "zrv_test", fetch });

    const result = await client.videos.createAndPoll(
      { prompt: "A paper airplane" },
      { pollIntervalMs: 0 }
    );

    expect(result.status).toBe("completed");
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("returns a failed job without downloading content", async () => {
    const statuses = ["processing", "failed"];
    const fetch = vi.fn(async () => Response.json(video("vid_3", statuses.shift()!, { code: "failed" })));
    const client = new ZorveusOpenAI({ apiKey: "zrv_test", fetch });

    const result = await client.videos.createAndPoll(
      { prompt: "A paper airplane" },
      { pollIntervalMs: 0 }
    );

    expect(result.status).toBe("failed");
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls.every(([url]) => !String(url).endsWith("/content"))).toBe(true);
  });

  it("waits for the configured polling interval", async () => {
    vi.useFakeTimers();
    const statuses = ["processing", "completed"];
    const fetch = vi.fn(async () => Response.json(video("vid_4", statuses.shift()!)));
    const client = new ZorveusOpenAI({ apiKey: "zrv_test", fetch });

    const pending = client.videos.createAndPoll(
      { prompt: "A paper airplane" },
      { pollIntervalMs: 250 }
    );
    await vi.advanceTimersByTimeAsync(249);
    expect(videoRequests(fetch)).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    await expect(pending).resolves.toMatchObject({ status: "completed" });
    vi.useRealTimers();
  });

  it("stops polling on timeout", async () => {
    vi.useFakeTimers();
    const fetch = vi.fn(async () => Response.json(video("vid_5", "processing")));
    const client = new ZorveusOpenAI({ apiKey: "zrv_test", fetch });

    const pending = client.videos.createAndPoll(
      { prompt: "A paper airplane" },
      { pollIntervalMs: 1_000, timeoutMs: 100 }
    );
    const rejection = expect(pending).rejects.toThrow("timed out after 100ms");
    await vi.advanceTimersByTimeAsync(100);
    await rejection;
    expect(videoRequests(fetch)).toHaveLength(1);
    vi.useRealTimers();
  });

  it("stops polling when cancelled", async () => {
    const controller = new AbortController();
    const fetch = vi.fn(async () => Response.json(video("vid_6", "processing")));
    const client = new ZorveusOpenAI({ apiKey: "zrv_test", fetch });

    const pending = client.videos.createAndPoll(
      { prompt: "A paper airplane" },
      { pollIntervalMs: 10_000, signal: controller.signal }
    );
    while (videoRequests(fetch).length === 0) await Promise.resolve();
    controller.abort(new Error("cancelled by test"));

    await expect(pending).rejects.toThrow();
    expect(videoRequests(fetch)).toHaveLength(1);
  });

  it("downloads binary content without text conversion", async () => {
    const bytes = new Uint8Array([0, 255, 10, 128]);
    const fetch = vi.fn(async () => new Response(bytes, { headers: { "Content-Type": "video/mp4" } }));
    const client = new ZorveusOpenAI({ apiKey: "zrv_test", fetch });

    const response = await client.videos.downloadContent("vid_7");

    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
  });
});
