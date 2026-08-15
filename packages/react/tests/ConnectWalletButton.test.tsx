import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ZorveusProvider, ConnectWalletButton } from "../src/index";

describe("ConnectWalletButton", () => {
  it("renders with default label and custom classes", () => {
    render(
      <ZorveusProvider clientId="zrv_client_123" redirectUri="https://myapp.com/callback">
        <ConnectWalletButton className="custom-button" variant="default" size="md">
          Connect AI Wallet
        </ConnectWalletButton>
      </ZorveusProvider>
    );

    const button = screen.getByRole("button", { name: "Connect AI Wallet" });
    expect(button).toBeDefined();
    expect(button.className).toContain("custom-button");
  });

  it("renders with outline variant", () => {
    render(
      <ZorveusProvider clientId="zrv_client_123" redirectUri="https://myapp.com/callback">
        <ConnectWalletButton variant="outline" size="sm">
          Connect
        </ConnectWalletButton>
      </ZorveusProvider>
    );

    const button = screen.getByRole("button", { name: "Connect" });
    expect(button).toBeDefined();
  });

  it("renders custom markup via renderCustom prop", () => {
    render(
      <ZorveusProvider clientId="zrv_client_123" redirectUri="https://myapp.com/callback">
        <ConnectWalletButton
          renderCustom={(auth) => (
            <button className="my-shadcn-btn" onClick={() => void auth.connect()}>
              Custom Connect: {auth.isConnected ? "Online" : "Offline"}
            </button>
          )}
        />
      </ZorveusProvider>
    );

    const button = screen.getByRole("button", { name: "Custom Connect: Offline" });
    expect(button).toBeDefined();
    expect(button.className).toBe("my-shadcn-btn");
  });
});
