# @zorveus/react

Official React hooks, Context Providers, and UI components for [Zorveus](https://zorveus.com).

Enables 1-click user AI wallet connection, streaming inference, model selection, and spend limit tracking in React & Next.js applications.

---

## Installation

```bash
npm install @zorveus/react @zorveus/sdk
```

---

## Quickstart

### 1. Setup `<ZorveusProvider>`

Wrap your application with `<ZorveusProvider>` and mount `<OAuthCallbackHandler />` at your root:

```tsx
import React from "react";
import { ZorveusProvider, OAuthCallbackHandler } from "@zorveus/react";

export function App({ children }: { children: React.ReactNode }) {
  return (
    <ZorveusProvider
      clientId="zrv_client_92294673f5284df3899b7eaaf43ecd82"
      redirectUri="http://localhost:5173/oauth/callback"
      persistToken={true} // Persists connection across browser refreshes
    >
      <OAuthCallbackHandler />
      {children}
    </ZorveusProvider>
  );
}
```

---

### 2. Connect AI Wallet & Stream Inference

```tsx
import React from "react";
import {
  ConnectWalletButton,
  useZorveusAuth,
  useZorveusInference,
  useZorveusModels,
  SpendCapIndicator
} from "@zorveus/react";

export function AIStudio() {
  const { isConnected, error: authError } = useZorveusAuth();
  const { models, isLoading: modelsLoading } = useZorveusModels({ routeStatus: "available" });
  
  const { messages, submitPrompt, isStreaming } = useZorveusInference({
    model: "openai/gpt-4.1-mini",
    systemPrompt: "You are an expert AI assistant."
  });

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
      {/* 1-Click Google Sign-In Styled AI Wallet Button */}
      <ConnectWalletButton />

      {authError && <p style={{ color: "red" }}>Error: {authError.message}</p>}

      {isConnected && (
        <div style={{ marginTop: 24 }}>
          {/* Visual Budget Cap Indicator */}
          <SpendCapIndicator current={12.50} limit={50.00} period="monthly" />

          {/* Model Selector */}
          <select disabled={modelsLoading}>
            {models.map((m) => (
              <option key={m.id} value={m.id}>{m.id}</option>
            ))}
          </select>

          {/* Submit Action */}
          <button 
            onClick={() => submitPrompt("Write 3 marketing tips for SaaS.")}
            disabled={isStreaming}
          >
            {isStreaming ? "Streaming..." : "Generate Tips"}
          </button>

          {/* Live Message Output */}
          <div style={{ marginTop: 16 }}>
            {messages.map((m, i) => (
              <div key={i}>
                <strong>{m.role}:</strong> {m.content}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 🧩 Component & Hook Reference

| Export | Type | Description |
| :--- | :--- | :--- |
| `<ZorveusProvider>` | Component | Root Context Provider managing auth state, client lifecycle, and session storage |
| `<ConnectWalletButton>` | Component | Responsive Google Sign-In style button with PKCE popup workflow & Zorveus branding |
| `<OAuthCallbackHandler>` | Component | Zero-UI listener component that processes OAuth popup redirects |
| `<SpendCapIndicator>` | Component | Progress bar with threshold color changes (Green $\rightarrow$ Amber $\rightarrow$ Red) |
| `useZorveusAuth()` | Hook | Provides `{ isConnected, accessToken, error, connect, disconnect }` |
| `useZorveusInference()` | Hook | Provides streaming inference state, message queue, abort controller, and `submitPrompt()` |
| `useZorveusModels()` | Hook | Fetches and caches accessible foundation models (zero unauthenticated network calls) |
| `useZorveusSpend()` | Hook | Fetches live spending, budget caps, and balances (`GET /inference-keys/usage`) |
| `useZorveusContext()` | Hook | Accesses underlying raw context and initialized `@zorveus/sdk` `client` instance |

---

## License

MIT © [Zorveus Inc.](https://zorveus.com)
