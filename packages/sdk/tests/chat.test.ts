import { describe, it, expect, vi, beforeEach } from "vitest";
import { Zorveus } from "../src/index";

describe("Chat Completions", () => {
  let globalFetch: typeof fetch;

  beforeEach(() => {
    globalFetch = global.fetch;
  });

  it("sends request body metadata for inline product user attribution", async () => {
    const mockResponse = {
      id: "chatcmpl-123",
      object: "chat.completion",
      created: 1677652288,
      model: "openai/gpt-4o",
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: "Hello there!" },
          finish_reason: "stop"
        }
      ],
      usage: { prompt_tokens: 9, completion_tokens: 12, total_tokens: 21 }
    };

    let capturedUrl = "";
    let capturedBody: Record<string, unknown> = {};

    global.fetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      capturedUrl = url;
      capturedBody = JSON.parse((init?.body as string) || "{}");

      return new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    });

    const client = new Zorveus({
      apiKey: "zrv_live_test_key"
    });

    const res = await client.chat.completions.create({
      model: "openai/gpt-4o",
      messages: [{ role: "user", content: "Hello" }],
      zorveusMetadata: {
        externalUserId: "usr_ext_8842",
        displayName: "Alice",
        userEmail: "alice@example.com"
      }
    });

    expect(capturedUrl).toContain("/chat/completions");
    expect(capturedBody.model).toBe("openai/gpt-4o");
    expect(capturedBody.metadata).toEqual({
      external_user_id: "usr_ext_8842",
      product_user: {
        display_name: "Alice",
        email: "alice@example.com",
        metadata: null
      }
    });
    expect(res.choices[0].message.content).toBe("Hello there!");

    global.fetch = globalFetch;
  });
});
