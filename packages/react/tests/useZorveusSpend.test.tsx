import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ZorveusProvider } from "../src/context/ZorveusContext";
import { useZorveusSpend } from "../src/hooks/useZorveusSpend";

describe("useZorveusSpend", () => {
  it("fetches and parses live usage, spend cap, and remaining balance", async () => {
    const mockUsage = {
      status: "active",
      app_id: "app_mindspire_123",
      app_connection_id: "appcon_01j6abc",
      currency: "USD",
      period: "monthly",
      spend_cap: "50.000000000000",
      spent_this_period: "12.500000000000",
      remaining_balance: "37.500000000000",
      reset_at: "2026-09-01T00:00:00Z"
    };

    const mockFetch = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify(mockUsage), {
          status: 200,
          headers: { "content-type": "application/json" }
        })
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

    const { result } = renderHook(() => useZorveusSpend(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.spent).toBe(12.5);
      expect(result.current.spentFormatted).toBe("12.50");
      expect(result.current.spendCap).toBe(50);
      expect(result.current.spendCapFormatted).toBe("50.00");
      expect(result.current.remainingBalance).toBe(37.5);
      expect(result.current.remainingBalanceFormatted).toBe("37.50");
      expect(result.current.currency).toBe("USD");
      expect(result.current.status).toBe("active");
    });
  });
});
