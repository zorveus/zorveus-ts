import { describe, it, expect, vi } from "vitest";
import { Zorveus } from "../src/index";

describe("Streaming Completions (SSE)", () => {
  it("streams chunks asynchronously and handles [DONE]", async () => {
    const ssePayload = [
      'data: {"id":"chatcmpl_1","object":"chat.completion.chunk","created":1723500000,"model":"anthropic/claude-3-5-sonnet","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}\n\n',
      'data: {"id":"chatcmpl_1","object":"chat.completion.chunk","created":1723500000,"model":"anthropic/claude-3-5-sonnet","choices":[{"index":0,"delta":{"content":" world!"},"finish_reason":null}]}\n\n',
      'data: [DONE]\n\n'
    ].join("");

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(ssePayload));
        controller.close();
      }
    });

    const mockFetch = vi.fn().mockResolvedValue(
      new Response(stream, {
        status: 200,
        headers: { "Content-Type": "text/event-stream" }
      })
    );

    const client = new Zorveus({
      apiKey: "zrv_live_test_key",
      fetch: mockFetch as typeof globalThis.fetch
    });

    const asyncStream = await client.chat.completions.create({
      model: "anthropic/claude-3-5-sonnet",
      messages: [{ role: "user", content: "Say hello" }],
      stream: true,
      zorveusMetadata: { externalUserId: "usr_123" }
    });

    const chunks: string[] = [];
    for await (const chunk of asyncStream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) chunks.push(content);
    }

    expect(chunks).toEqual(["Hello", " world!"]);
  });
});
