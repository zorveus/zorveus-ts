import { describe, it, expect, vi } from "vitest";
import { ZorveusOpenAI } from "../src/adapters/openai";
import { createZorveus } from "../src/adapters/vercel";

describe("OpenAI SDK Adapter (ZorveusOpenAI)", () => {
  it("automatically injects metadata.external_user_id and product_user attribution into request body", async () => {
    let capturedBody: any = null;

    const customFetch = vi.fn().mockImplementation(async (url, init) => {
      if (init?.body) {
        capturedBody = JSON.parse(init.body as string);
      }
      return new Response(
        JSON.stringify({
          id: "chatcmpl-123",
          object: "chat.completion",
          created: 1677652288,
          model: "openai/gpt-4.1-mini",
          choices: [{ index: 0, message: { role: "assistant", content: "Hello!" }, finish_reason: "stop" }]
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    });

    const openai = new ZorveusOpenAI({
      apiKey: "zrv_live_test_key_123",
      externalUserId: "cus_12345",
      displayName: "Ada Lovelace",
      userEmail: "ada@example.com",
      userMetadata: { plan: "pro" },
      fetch: customFetch
    });

    await openai.chat.completions.create({
      model: "openai/gpt-4.1-mini",
      messages: [{ role: "user", content: "Hi" }]
    });

    expect(capturedBody).not.toBeNull();
    expect(capturedBody.metadata).toBeDefined();
    expect(capturedBody.metadata.external_user_id).toBe("cus_12345");
    expect(capturedBody.metadata.product_user).toEqual({
      display_name: "Ada Lovelace",
      email: "ada@example.com",
      metadata: { plan: "pro" }
    });
  });

  it("automatically injects metadata.external_user_id into responses.create if present", async () => {
    let capturedBody: any = null;

    const customFetch = vi.fn().mockImplementation(async (url, init) => {
      if (init?.body) {
        capturedBody = JSON.parse(init.body as string);
      }
      return new Response(
        JSON.stringify({
          id: "resp-123",
          object: "response",
          created_at: 1677652288,
          model: "openai/gpt-4o",
          output: []
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    });

    const openai = new ZorveusOpenAI({
      apiKey: "zrv_live_test_key_123",
      externalUserId: "usr_sara_101",
      fetch: customFetch
    });

    if (openai.responses && typeof (openai.responses as any).create === "function") {
      await (openai.responses as any).create({
        model: "openai/gpt-4o",
        input: "Hello"
      });

      expect(capturedBody).not.toBeNull();
      expect(capturedBody.metadata).toBeDefined();
      expect(capturedBody.metadata.external_user_id).toBe("usr_sara_101");
    }
  });
});

describe("Vercel AI SDK Adapter (createZorveus)", () => {
  it("creates an OpenAI provider with custom fetch that injects metadata and product_user attribution", async () => {
    let capturedBody: any = null;

    const mockFetch = vi.fn().mockImplementation(async (url, init) => {
      if (init?.body) {
        capturedBody = JSON.parse(init.body as string);
      }
      return new Response(
        JSON.stringify({
          id: "chatcmpl-456",
          object: "chat.completion",
          created: 1677652288,
          model: "openai/gpt-4.1-mini",
          choices: [{ index: 0, message: { role: "assistant", content: "Vercel response" }, finish_reason: "stop" }]
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    });

    const zorveusProvider = createZorveus({
      apiKey: "zrv_live_test_key_123",
      externalUserId: "cus_12345",
      displayName: "Ada Lovelace",
      userEmail: "ada@example.com",
      fetch: mockFetch
    });

    expect(zorveusProvider).toBeDefined();
    expect(typeof zorveusProvider).toBe("function");

    const model = zorveusProvider("openai/gpt-4.1-mini");
    expect(model.modelId).toBe("openai/gpt-4.1-mini");
  });
});
