import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ZorveusProvider, useZorveusContext } from "../src/context/ZorveusContext";
import { useZorveusModels } from "../src/hooks/useZorveusModels";

function TestClientConsumer() {
  const { isConnected, client, openAIClient, isLoadingAuth } = useZorveusContext();
  return (
    <div>
      <div data-testid="is-connected">{String(isConnected)}</div>
      <div data-testid="has-client">{String(client !== null)}</div>
      <div data-testid="has-openai-client">{String(openAIClient !== null)}</div>
      <div data-testid="is-loading-auth">{String(isLoadingAuth)}</div>
    </div>
  );
}

function TestModelsConsumer() {
  const { models, isLoading, error } = useZorveusModels({ autoFetch: true });
  return (
    <div>
      <div data-testid="models-count">{models.length}</div>
      <div data-testid="models-loading">{String(isLoading)}</div>
      <div data-testid="models-error">{error ? error.message : "no-error"}</div>
    </div>
  );
}

describe("ZorveusProvider Token Hydration & openAIClient", () => {
  it("provides client and openAIClient synchronously when accessToken is passed", () => {
    render(
      <ZorveusProvider
        clientId="client_123"
        redirectUri="http://localhost:3000/callback"
        accessToken="zrv_test_sync_token"
      >
        <TestClientConsumer />
      </ZorveusProvider>
    );

    expect(screen.getByTestId("is-connected").textContent).toBe("true");
    expect(screen.getByTestId("has-client").textContent).toBe("true");
    expect(screen.getByTestId("has-openai-client").textContent).toBe("true");
    expect(screen.getByTestId("is-loading-auth").textContent).toBe("false");
  });

  it("resolves token asynchronously with tokenProvider and updates client", async () => {
    const mockTokenProvider = vi.fn().mockImplementation(async () => {
      return {
        access_token: "zrv_resolved_async_token",
        app_connection_id: "conn_456"
      };
    });

    render(
      <ZorveusProvider
        clientId="client_123"
        redirectUri="http://localhost:3000/callback"
        tokenProvider={mockTokenProvider}
      >
        <TestClientConsumer />
      </ZorveusProvider>
    );

    // Initially loading auth
    expect(screen.getByTestId("is-connected").textContent).toBe("false");
    expect(screen.getByTestId("is-loading-auth").textContent).toBe("true");

    // After resolution
    await waitFor(() => {
      expect(screen.getByTestId("is-connected").textContent).toBe("true");
      expect(screen.getByTestId("has-client").textContent).toBe("true");
      expect(screen.getByTestId("has-openai-client").textContent).toBe("true");
      expect(screen.getByTestId("is-loading-auth").textContent).toBe("false");
    });

    expect(mockTokenProvider).toHaveBeenCalledTimes(1);
  });

  it("prevents useZorveusModels from flashing unauthenticated error while tokenProvider is resolving", async () => {
    let resolveToken: (val: any) => void;
    const tokenPromise = new Promise<any>((resolve) => {
      resolveToken = resolve;
    });

    render(
      <ZorveusProvider
        clientId="client_123"
        redirectUri="http://localhost:3000/callback"
        tokenProvider={() => tokenPromise}
      >
        <TestModelsConsumer />
      </ZorveusProvider>
    );

    // While resolving, it should NOT display an unauthenticated error
    expect(screen.getByTestId("models-error").textContent).toBe("no-error");
    expect(screen.getByTestId("models-loading").textContent).toBe("true");

    // Resolve token
    resolveToken!({
      access_token: "zrv_test_key"
    });

    await waitFor(() => {
      expect(screen.getByTestId("models-error").textContent).toBe("no-error");
    });
  });
});
