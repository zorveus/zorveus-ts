import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ZorveusProvider, useZorveusContext } from "../src/index";

function TestConsumer() {
  const { clientId, client } = useZorveusContext();
  return (
    <div>
      <span data-testid="client-id">{clientId}</span>
      <span data-testid="has-client">{client ? "yes" : "no"}</span>
    </div>
  );
}

describe("ZorveusProvider", () => {
  it("provides context to children", () => {
    render(
      <ZorveusProvider clientId="zrv_client_123" inferenceKey="zrv_live_key">
        <TestConsumer />
      </ZorveusProvider>
    );

    expect(screen.getByTestId("client-id").textContent).toBe("zrv_client_123");
    expect(screen.getByTestId("has-client").textContent).toBe("yes");
  });

  it("throws when hook is used outside provider", () => {
    expect(() => render(<TestConsumer />)).toThrow(
      "Zorveus hooks and components must be used within a <ZorveusProvider>."
    );
  });
});
