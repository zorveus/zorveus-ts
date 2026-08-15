import { describe, it, expect, vi } from "vitest";
import { Zorveus } from "../src/index";

describe("Models Discovery", () => {
  it("lists models with route status filter", async () => {
    let capturedUrl = "";

    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      capturedUrl = url;

      return new Response(
        JSON.stringify({
          object: "list",
          data: [
            { id: "openai/gpt-4o", object: "model", created: 1715000000, owned_by: "openai", route_status: "available" },
            { id: "anthropic/claude-3-5-sonnet", object: "model", created: 1718000000, owned_by: "anthropic", route_status: "available" }
          ]
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    });

    const client = new Zorveus({
      apiKey: "zrv_test_key",
      fetch: mockFetch as typeof globalThis.fetch
    });

    const result = await client.models.list({ routeStatus: "available" });

    expect(capturedUrl).toBe("https://api.zorveus.com/v1/models?route_status=available");
    expect(result.data.length).toBe(2);
    expect(result.data[0].id).toBe("openai/gpt-4o");
  });
});
