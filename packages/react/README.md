# `@zorveus/react`

Official React hooks, Context Provider, and UI components for the [Zorveus](https://zorveus.com) AI platform.

Provides user AI wallet connection, streaming inference, model selection, and spend limit tracking in React 18+ and Next.js applications.

## Installation

```bash
npm install @zorveus/react @zorveus/sdk
```

## Quickstart

### Setup `<ZorveusProvider>` and `<OAuthCallbackHandler>`

Wrap your application with `<ZorveusProvider>` at the root, and include `<OAuthCallbackHandler />` to process popup redirect events:

```tsx
import React from "react";
import { ZorveusProvider, OAuthCallbackHandler } from "@zorveus/react";

export function App({ children }: { children: React.ReactNode }) {
  return (
    <ZorveusProvider
      clientId="zrv_client_92294673f5284df3899b7eaaf43ecd82"
      redirectUri="http://localhost:5173/oauth/callback"
      persistToken={true}
    >
      <OAuthCallbackHandler />
      {children}
    </ZorveusProvider>
  );
}
```

### Connect AI wallet, select model, and stream inference

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
  const { models, isLoading: modelsLoading } = useZorveusModels({ routeStatus: "available" });
  const { usage } = useZorveusSpend();

  const { messages, submitPrompt, isStreaming, stopStreaming } = useZorveusInference({
    model: "openai/gpt-4.1-mini",
    systemPrompt: "You are an expert AI assistant."
  });

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
      <ConnectWalletButton />

      {authError && <p style={{ color: "red" }}>Auth error: {authError.message}</p>}

      {isConnected && (
        <div style={{ marginTop: 24 }}>
          {usage && (
            <SpendCapIndicator
              current={parseFloat(usage.spent_this_period)}
              limit={parseFloat(usage.spend_cap)}
              period={usage.period}
            />
          )}

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

## Components and hooks reference

### Components

| Export | Type | Description |
| :--- | :--- | :--- |
| `<ZorveusProvider>` | Provider | Root Context Provider managing auth state, client lifecycle, and token storage |
| `<ConnectWalletButton>` | Component | Button component with PKCE popup workflow and Zorveus branding |
| `<OAuthCallbackHandler>` | Component | Handler component that processes OAuth popup redirects |
| `<SpendCapIndicator>` | Component | Progress bar indicator with status color transitions |

### Hooks

| Hook | Return value | Description |
| :--- | :--- | :--- |
| `useZorveusAuth()` | `{ isConnected, accessToken, error, connect, disconnect, connectionId }` | Accesses connection state and triggers OAuth PKCE connect/disconnect flows |
| `useZorveusInference(options)` | `{ messages, isStreaming, submitPrompt, stopStreaming, clearMessages, error }` | Manages streaming inference, token accumulation, and message history |
| `useZorveusModels(options)` | `{ models, isLoading, error, refetch }` | Queries accessible models (`GET /v1/models?route_status=available`) |
| `useZorveusSpend(options)` | `{ usage, isLoading, error, refetch }` | Queries live spending, budget caps, and balances (`GET /inference-keys/usage`) |
| `useZorveusContext()` | `{ client, isConnected, accessToken, ... }` | Direct access to the raw Zorveus context and initialized `@zorveus/sdk` client |

## Provider configuration options

```tsx
<ZorveusProvider
  clientId="your_oauth_client_id"
  redirectUri="http://localhost:5173/oauth/callback"
  persistToken={true}
  baseURL="https://api.zorveus.com"
  gatewayBaseURL="https://api.zorveus.com/v1"
  scopes={["inference:write", "models:*"]}
>
  <App />
</ZorveusProvider>
```

## License

MIT © [Zorveus Inc.](https://zorveus.com)
