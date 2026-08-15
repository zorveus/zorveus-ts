# Zorveus TypeScript & React SDK Monorepo

The official TypeScript and React client SDKs for the [Zorveus](https://zorveus.com) AI Infrastructure Platform.

---

## 📦 Monorepo Packages

| Package | Version | Description | Target Environment |
| :--- | :--- | :--- | :--- |
| [`@zorveus/sdk`](./packages/sdk) | `0.1.0` | Core TypeScript/JavaScript client for AI Gateway, Product Users, Credit Grants, and OAuth PKCE | Node.js, Next.js, Edge, Browser |
| [`@zorveus/react`](./packages/react) | `0.1.0` | React hooks, Context Providers, and UI components (`ConnectWalletButton`, `SpendCapIndicator`) | React 18+, Next.js (Client) |

---

## 🚀 Reference Applications

| Application | Path | Tech Stack | Highlights |
| :--- | :--- | :--- | :--- |
| **ResumeCraft AI** | [`examples/saasify-suite`](./examples/saasify-suite) | React, Vite, TS | Startup Control Plane: candidate directory, tier keys, external ID credit grants, streaming career tools |
| **MindSpire Studio** | [`examples/mindspire-studio`](./examples/mindspire-studio) | React, Vite, TS | 1-Click User AI Wallet OAuth PKCE connect, BYO billing, live model discovery, and streaming |
| **Node.js Automation Scripts** | [`examples/node-scripts`](./examples/node-scripts) | Node.js, TS | Stand-alone CLI scripts for inference streaming, user provisioning, and credit grants |

---

## ⚡ Quickstart: Backend / Full-Stack (`@zorveus/sdk`)

```bash
npm install @zorveus/sdk
```

### 1. Master Organization Control Plane (`ZorveusServiceClient`)

Anchor all product user operations to your SaaS user identifiers (`external_user_id`):

```typescript
import { ZorveusServiceClient } from "@zorveus/sdk";

const zorveus = new ZorveusServiceClient({
  apiKey: process.env.ZORVEUS_SERVICE_KEY // zrv_svc_...
});

const appId = "app_startup_123";
const externalUserId = "usr_sara_101";

// 1. Auto-provision candidate profile
const user = await zorveus.productUsers.createOrUpdate({
  appId,
  externalUserId,
  displayName: "Sara Connor",
  email: "sara@example.com"
});

// 2. Issue promotional AI credits
await zorveus.productUsers.grantCreditByExternalId({
  appId,
  externalUserId,
  amount: "25.000000000000",
  source: "promotion",
  reason: "Welcome Bonus"
});

// 3. Query user credit grants ledger
const ledger = await zorveus.productUsers.listCreditGrantsByExternalId({
  appId,
  externalUserId
});
```

### 2. High-Speed Inference Client (`Zorveus`)

```typescript
import { Zorveus } from "@zorveus/sdk";

const client = new Zorveus({
  apiKey: process.env.ZORVEUS_INFERENCE_KEY
});

// Stream completions with user attribution
const stream = await client.chat.completions.create({
  model: "openai/gpt-4.1-mini",
  messages: [{ role: "user", content: "Write a high-converting headline." }],
  stream: true,
  zorveusMetadata: { externalUserId: "usr_sara_101" }
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || "");
}
```

---

## ⚡ Quickstart: Frontend / React (`@zorveus/react`)

```bash
npm install @zorveus/react @zorveus/sdk
```

```tsx
import React from "react";
import {
  ZorveusProvider,
  OAuthCallbackHandler,
  ConnectWalletButton,
  useZorveusAuth,
  useZorveusInference,
  useZorveusModels,
  SpendCapIndicator
} from "@zorveus/react";

export function App() {
  return (
    <ZorveusProvider
      clientId="your_oauth_client_id"
      redirectUri="http://localhost:5173/oauth/callback"
      persistToken={true}
    >
      <OAuthCallbackHandler />
      <Studio />
    </ZorveusProvider>
  );
}

function Studio() {
  const { isConnected } = useZorveusAuth();
  const { models } = useZorveusModels({ routeStatus: "available" });
  const { messages, submitPrompt, isStreaming } = useZorveusInference({
    model: "openai/gpt-4.1-mini"
  });

  return (
    <div>
      <ConnectWalletButton />
      {isConnected && (
        <div>
          <button onClick={() => submitPrompt("Generate SEO tips")} disabled={isStreaming}>
            {isStreaming ? "Streaming..." : "Generate"}
          </button>
          <div>
            {messages.map((m, i) => <p key={i}>{m.content}</p>)}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 🛠️ Monorepo Development

```bash
# Install dependencies
npm install

# Run typecheck across all workspaces
npm run typecheck

# Run test suite across all packages (Vitest)
npm test

# Build all packages and applications
npm run build

# Launch ResumeCraft AI Demo
npm run demo:saasify

# Launch MindSpire Studio Demo
npm run demo:mindspire
```

---

## 📄 License

MIT © [Zorveus Inc.](https://zorveus.com)
