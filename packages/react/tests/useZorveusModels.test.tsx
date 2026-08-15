import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ZorveusProvider } from "../src/context/ZorveusContext";
import { useZorveusModels } from "../src/hooks/useZorveusModels";

describe("useZorveusModels", () => {
  it("initializes with empty models array and fetches models dynamically", async () => {
    const mockFetch = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            object: "list",
            data: [
              { id: "openai/gpt-4o", object: "model", created: 1234, owned_by: "openai" }
            ]
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" }
          }
        )
      )
    );

    globalThis.fetch = mockFetch as typeof globalThis.fetch;

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ZorveusProvider
        clientId="test_client"
        redirectUri="http://localhost:3000/callback"
        inferenceKey="zrv_test_key"
        gatewayBaseURL="https://api.zorveus.com/v1"
        authBaseUrl="https://api.zorveus.com"
      >
        {children}
      </ZorveusProvider>
    );

    const { result } = renderHook(() => useZorveusModels(), { wrapper });

    expect(result.current.models).toEqual([]);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.models).toEqual([
        { id: "openai/gpt-4o", object: "model", created: 1234, owned_by: "openai" }
      ]);
    });
  });
});
