import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { ZorveusProvider, useZorveusAuth } from "../src/index";

function AuthConsumer() {
  const { isConnected, connect, disconnect, fundingOrg } = useZorveusAuth();
  return (
    <div>
      <span data-testid="connected">{isConnected ? "connected" : "disconnected"}</span>
      <span data-testid="org">{fundingOrg?.name || "none"}</span>
      <button data-testid="connect-btn" onClick={() => void connect({ popup: false })}>
        Connect
      </button>
      <button data-testid="disconnect-btn" onClick={() => void disconnect()}>
        Disconnect
      </button>
    </div>
  );
}

describe("useZorveusAuth", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("handles connect and disconnect state", async () => {
    render(
      <ZorveusProvider clientId="zrv_client_123" redirectUri="https://myapp.com/callback">
        <AuthConsumer />
      </ZorveusProvider>
    );

    expect(screen.getByTestId("connected").textContent).toBe("disconnected");
    expect(screen.getByTestId("org").textContent).toBe("none");
  });
});
