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
