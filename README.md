# Zorveus TypeScript & React SDK Monorepo

Official TypeScript and React SDKs for the [Zorveus](https://zorveus.com) AI Infrastructure Platform.

Zorveus empowers AI applications and SaaS platforms with:
- **User-Owned AI Wallets & OAuth 2.0 PKCE Connect**: Let users bring their own AI billing or credentials securely.
- **Unified AI Gateway & Streaming Inference**: Single OpenAI-compatible client for all foundation models (OpenAI, Anthropic, Gemini, DeepSeek, etc.).
- **Product User Management & Credit Grants**: Manage end-user spend caps, credit grants, token usage, and analytics.
- **Provider Credentials Management**: Bring-your-own-key (BYOK) encryption and routing for foundation model providers.

---

## 📦 Packages in this Repository

| Package | Version | Description | Target Environment |
| :--- | :--- | :--- | :--- |
| [`@zorveus/sdk`](./packages/sdk) | `0.1.0` | Core TypeScript/JavaScript SDK for Zorveus APIs, AI Gateway, and OAuth PKCE | Node.js, Next.js, Edge, Browser |
| [`@zorveus/react`](./packages/react) | `0.1.0` | React hooks, Context Providers, and UI Components (`ConnectWalletButton`, etc.) | React 18+, Next.js (Client) |

---

## 🚀 Quickstart: Backend / Server-Side (`@zorveus/sdk`)

### 1. Installation

```bash
npm install @zorveus/sdk
```

### 2. Startup Service Management (`ZorveusServiceClient`)

Use your master Organization Service Key (`zrv_service_...`) on your backend to manage product users, check credit balances, or grant AI credits:

```typescript
import { ZorveusServiceClient } from "@zorveus/sdk";

const zorveus = new ZorveusServiceClient({
  apiKey: process.env.ZORVEUS_SERVICE_KEY // zrv_service_...
});

// 1. Fetch user by your SaaS external ID
const user = await zorveus.productUsers.getByExternalId({
  appId: "app_marketing_123",
  externalUserId: "usr_alex_8842"
});

console.log("Balance:", user.credits?.available_credits);
console.log("Monthly Cap:", user.cap?.amount);

// 2. Grant credits to an onboarding user (financial decimal precision)
const grant = await zorveus.productUsers.grantCredit(user.product_end_user_id, {
  appId: "app_marketing_123",
  amount: "50.000000000000",
  reason: "Sign-up bonus"
});
```

### 3. Server-Side AI Inference (`Zorveus`)

```typescript
import { Zorveus } from "@zorveus/sdk";

const client = new Zorveus({
  apiKey: process.env.ZORVEUS_INFERENCE_KEY // Direct inference key or user access token
});

// Streaming Chat Completion
const stream = await client.chat.completions.create({
  model: "openai/gpt-4.1-mini",
  messages: [{ role: "user", content: "Write a high-converting B2B SaaS headline." }],
  stream: true
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || "");
}
```

---

## ⚡ Quickstart: Frontend / React (`@zorveus/react`)

### 1. Installation

```bash
npm install @zorveus/react @zorveus/sdk
```

### 2. Wrap Application in `<ZorveusProvider>`

```tsx
import React from "react";
import { ZorveusProvider, OAuthCallbackHandler } from "@zorveus/react";

export function App() {
  return (
    <ZorveusProvider
      clientId="zrv_client_92294673f5284df3899b7eaaf43ecd82"
      redirectUri="http://localhost:5173/oauth/callback"
      persistToken={true} // Automatically stores connection in browser session
    >
      {/* Listens for popup OAuth callback messages */}
      <OAuthCallbackHandler />

      <Dashboard />
    </ZorveusProvider>
  );
}
```

### 3. Add `ConnectWalletButton` & AI Streaming Hook

```tsx
import React from "react";
import {
  ConnectWalletButton,
  useZorveusAuth,
  useZorveusInference,
  useZorveusModels
} from "@zorveus/react";

export function Dashboard() {
  const { isConnected } = useZorveusAuth();
  const { models } = useZorveusModels({ routeStatus: "available" });
  
  const { messages, submitPrompt, isStreaming } = useZorveusInference({
    model: "openai/gpt-4.1-mini",
    systemPrompt: "You are an expert copywriter."
  });

  return (
    <div>
      {/* 1-Click Google-Style AI Wallet Connect Button */}
      <ConnectWalletButton />

      {isConnected && (
        <div>
          <button onClick={() => submitPrompt("Generate SEO strategy")}>
            {isStreaming ? "Streaming..." : "Generate Strategy"}
          </button>

          <div>
            {messages.map((m, idx) => (
              <p key={idx}>{m.content}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 📚 Complete API Reference

### 1. `@zorveus/sdk`

#### Client Initialization
```typescript
import { Zorveus, ZorveusServiceClient } from "@zorveus/sdk";

// Direct Inference & Gateway Client
const client = new Zorveus({
  apiKey: "zrv_live_...",
  gatewayBaseURL: "https://api.zorveus.com/v1", // optional
  maxRetries: 3,                                // optional
  timeout: 60000                                // optional
});

// Organization Service Client (Backend management)
const serviceClient = new ZorveusServiceClient({
  apiKey: "zrv_service_...",
  baseURL: "https://api.zorveus.com"
});
```

#### Product Users Resource (`serviceClient.productUsers`)
* **`getByExternalId(params)`**: Query product user by SaaS external ID (`GET /product-users/by-external-id`).
* **`getCreditSummaryByExternalId(params)`**: Query lightweight balance summary (`GET /product-users/by-external-id/credit-summary`).
* **`createOrUpdate(params)`**: Upsert product user (`PUT /product-users/by-external-id`).
* **`get(productEndUserId)`**: Query product user by Zorveus ID (`GET /product-users/{id}`).
* **`list(params)`**: List product users for an organization (`GET /product-users`).
* **`grantCredit(productEndUserId, params)`**: Grant credits with strict financial decimal strings (`POST /product-users/{id}/credit-grants`).
* **`listCreditGrants(productEndUserId, params)`**: List user grants (`GET /product-users/{id}/credit-grants`).
* **`revokeCredit(productEndUserId, creditGrantId)`**: Revoke grant (`POST /product-users/{id}/credit-grants/{id}/revoke`).

#### Provider Credentials Resource (`serviceClient.providerCredentials`)
* **`create(params)`**: Store encrypted provider API key (OpenAI, Anthropic, Gemini, etc.).
* **`list(params)`**: List configured provider credentials.
* **`get(credentialId)`**: Get credential metadata.
* **`delete(credentialId)`**: Revoke / delete provider credential.

#### OAuth 2.0 PKCE Helper (`ZorveusOAuth`)
* **`generatePKCE()`**: Generates high-entropy `verifier`, `challenge`, and `state`.
* **`generateAuthUrl(params)`**: Builds standard authorization URL with requested scopes (`inference:write`, `models:*`).
* **`validateCallback(params)`**: Validates redirect parameters and anti-CSRF state token.
* **`exchangeToken(params)`**: Exchanges auth code for Bearer access token via `application/x-www-form-urlencoded`.
* **`revokeToken(params)`**: Revokes OAuth connection or token.

---

### 2. `@zorveus/react`

#### Provider & Context
* **`<ZorveusProvider>`**: Root context provider managing credentials, active client instance, and persistence.
* **`useZorveusContext()`**: Accesses raw context values and active `client` instance.

#### Hooks
* **`useZorveusAuth()`**: Returns `{ isConnected, accessToken, error, connect, disconnect }`.
* **`useZorveusInference(options)`**: Manages streaming chat completions, abort controllers, message histories, and prompt submission.
* **`useZorveusModels(options)`**: Fetches available models with auto-caching and zero unauthenticated network calls.

#### Components
* **`<ConnectWalletButton />`**: Standard Google Sign-In style AI Wallet Connect button with responsive state and Zorveus badge icon.
* **`<OAuthCallbackHandler />`**: Popup window receiver for OAuth PKCE redirect validation.
* **`<SpendCapIndicator />`**: Visual spending cap progress bar with status thresholds (Green / Amber / Red).

---

## 🛠️ Monorepo Development

```bash
# Install dependencies
npm install

# Run typecheck across all workspaces
npm run typecheck

# Run test suite across all packages (Vitest)
npm test

# Build all packages and demo applications
npm run build
```

---

## 📄 License

MIT © [Zorveus Inc.](https://zorveus.com)
