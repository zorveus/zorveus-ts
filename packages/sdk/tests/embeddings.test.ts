import { describe, it, expect, vi } from "vitest";
import { Zorveus } from "../src/index";

describe("Embeddings", () => {
  it("creates embeddings successfully", async () => {
    let capturedUrl = "";
    let capturedBody: Record<string, unknown> = {};

    const mockFetch = vi.fn().mockImplementation(async (url: string, init: RequestInit) => {
      capturedUrl = url;
      capturedBody = JSON.parse(init.body as string);

      return new Response(
        JSON.stringify({
          object: "list",
          data: [
            { index: 0, object: "embedding", embedding: [0.0023, -0.0091, 0.0152] },
            { index: 1, object: "embedding", embedding: [0.0011, -0.0042, 0.0089] }
          ],
          model: "openai/text-embedding-3-small",
          usage: { prompt_tokens: 8, total_tokens: 8 }
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    });

    const client = new Zorveus({
      apiKey: "zrv_test_key",
      fetch: mockFetch as typeof globalThis.fetch
    });

    const result = await client.embeddings.create({
      model: "openai/text-embedding-3-small",
      input: ["Semantic query 1", "Semantic query 2"]
    });

    expect(capturedUrl).toBe("https://api.zorveus.com/v1/embeddings");
    expect(capturedBody.model).toBe("openai/text-embedding-3-small");
    expect(result.data.length).toBe(2);
    expect(result.data[0].embedding.length).toBe(3);
  });
});


it("sends request usage metadata separately from the product-user profile and supports header defaults", async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [] })));
  const client = new Zorveus({ apiKey: "zrv_test", fetch });
  const usageMetadata = {
    activity_id: "embedding_123",
    activity_label: "Indexed document",
    details: { document_id: "document_123", pages: [1, 2] }
  };
  await client.embeddings.create({
    model: "zorveus/test-embedding",
    input: ["Example document"],
    zorveusMetadata: {
      externalUserId: "user_123",
      metadata: { plan: "pro" },
      usageMetadata
    }
  }, {
    headers: { "X-Zorveus-Usage-Metadata": JSON.stringify({ channel: "documents" }) }
  });
  const request = fetch.mock.calls[0][1] as RequestInit;
  expect(JSON.parse(request.body as string)).toEqual({
    model: "zorveus/test-embedding",
    input: ["Example document"],
    metadata: {
      external_user_id: "user_123",
      product_user: { metadata: { plan: "pro" } },
      usage_metadata: usageMetadata
    }
  });
  expect(new Headers(request.headers).get("X-Zorveus-Usage-Metadata"))
    .toBe(JSON.stringify({ channel: "documents" }));
});
