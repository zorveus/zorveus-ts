# @zorveus/react

Official React hooks, Context Providers, and UI components for the [Zorveus](https://zorveus.com) AI Infrastructure Platform.

Enables 1-click user AI wallet connection, streaming inference, live model selection, and real-time spend limit tracking in React 18+ and Next.js applications.

---

## 🚀 Installation

```bash
npm install @zorveus/react @zorveus/sdk
```

---

## ⚡ Quickstart

### 1. Setup `<ZorveusProvider>` & `<OAuthCallbackHandler>`

Wrap your application with `<ZorveusProvider>` at the root, and include `<OAuthCallbackHandler />` to process popup redirect events:

```tsx
import React from "react";
import { ZorveusProvider, OAuthCallbackHandler } from "@zorveus/react";

export function App({ children }: { children: React.ReactNode }) {
  return (
    <ZorveusProvider
      clientId="zrv_client_92294673f5284df3899b7eaaf43ecd82"
      redirectUri="http://localhost:5173/oauth/callback"
      persistToken={true} // Automatically persists connection across browser refreshes
    >
      {/* Zero-UI listener that receives popup auth tokens */}
      <OAuthCallbackHandler />
      {children}
    </ZorveusProvider>
  );
}
```

---

### 2. Connect AI Wallet, Select Model & Stream Inference

```tsx
import React from "react";
import {
  ConnectWalletButton,
  useZorveusAuth,
  useZorveusInference,
  useZorveusModels,
  useZorveusSpend,
  SpendCapIndicator
} from "@zorveus/react";

export function AIStudio() {
  const { isConnected, error: authError } = useZorveusAuth();
  
  // Live foundation models discovery (only queries when connected)
  const { models, isLoading: modelsLoading } = useZorveusModels({ routeStatus: "available" });
  
  // Live spend cap & usage tracking
  const { usage, isLoading: spendLoading } = useZorveusSpend();

  // Streaming AI inference
  const { messages, submitPrompt, isStreaming, stopStreaming } = useZorveusInference({
    model: "openai/gpt-4.1-mini",
    systemPrompt: "You are an expert AI assistant."
  });

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
      {/* 1-Click Google Sign-In Styled AI Wallet Button */}
      <ConnectWalletButton />

      {authError && <p style={{ color: "red" }}>Auth Error: {authError.message}</p>}

      {isConnected && (
        <div style={{ marginTop: 24 }}>
          {/* Visual Budget Cap Indicator */}
          {usage && (
            <SpendCapIndicator
              current={parseFloat(usage.spent_this_period)}
              limit={parseFloat(usage.spend_cap)}
              period={usage.period}
            />
          )}

          {/* Model Selector */}
          <div style={{ margin: "16px 0" }}>
            <label>Model: </label>
            <select disabled={modelsLoading}>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.provider ? `[${m.provider}] ` : ""}{m.name || m.id}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Action */}
          <button 
            onClick={() => submitPrompt("Explain quantum computing simply.")}
            disabled={isStreaming}
          >
            {isStreaming ? "Streaming..." : "Generate Explanation"}
          </button>

          {isStreaming && (
            <button onClick={stopStreaming} style={{ marginLeft: 8 }}>
              Stop
            </button>
          )}

          {/* Live Message Output */}
          <div style={{ marginTop: 16 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
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

### Components

| Export | Type | Description |
| :--- | :--- | :--- |
| `<ZorveusProvider>` | Provider | Root Context Provider managing auth state, client lifecycle, and token storage |
| `<ConnectWalletButton>` | Component | Responsive Google Sign-In style button with PKCE popup workflow & Zorveus branding |
| `<OAuthCallbackHandler>` | Component | Zero-UI listener component that processes OAuth popup redirects |
| `<SpendCapIndicator>` | Component | Progress bar with threshold color changes (Green $\rightarrow$ Amber $\rightarrow$ Red) |

### Hooks

| Hook | Return Value | Description |
| :--- | :--- | :--- |
| `useZorveusAuth()` | `{ isConnected, accessToken, error, connect, disconnect, connectionId }` | Accesses connection state and triggers OAuth PKCE connect/disconnect flows |
| `useZorveusInference(options)` | `{ messages, isStreaming, submitPrompt, stopStreaming, clearMessages, error }` | Manages streaming inference, token accumulation, and message history |
| `useZorveusModels(options)` | `{ models, isLoading, error, refetch }` | Queries accessible models (`GET /v1/models?route_status=available`) with auto-caching |
| `useZorveusSpend(options)` | `{ usage, isLoading, error, refetch }` | Queries live spending, budget caps, and balances (`GET /inference-keys/usage`) |
| `useZorveusContext()` | `{ client, isConnected, accessToken, ... }` | Direct access to the raw Zorveus context and initialized `@zorveus/sdk` `client` |

---

## ⚙️ Provider Configuration

```tsx
<ZorveusProvider
  clientId="your_oauth_client_id"
  redirectUri="http://localhost:5173/oauth/callback"
  persistToken={true}                        // Store access token in browser session
  baseURL="https://api.zorveus.com"          // Optional: Control plane API URL
  gatewayBaseURL="https://api.zorveus.com/v1" // Optional: AI Gateway URL
  scopes={["inference:write", "models:*"]}  // Optional: Requested OAuth scopes
>
  <App />
</ZorveusProvider>
```

---

## 📄 License

MIT © [Zorveus Inc.](https://zorveus.com)
