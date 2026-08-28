# Zorveus TypeScript and React SDK monorepo

Official TypeScript and React client libraries for the [Zorveus](https://zorveus.com) AI platform.

## Monorepo packages

| Package | Version | Description | Target environment |
| :--- | :--- | :--- | :--- |
| [`@zorveus/sdk`](./packages/sdk) | `0.1.7` | TypeScript client for AI Gateway, Product Users, Credit Grants, and OAuth PKCE | Node.js, Next.js, Edge, Browser |
| [`@zorveus/react`](./packages/react) | `0.1.7` | React hooks, Context Provider, and UI components (`ConnectWalletButton`, `SpendCapIndicator`) | React 18+, Next.js (Client) |

## Reference applications

| Application | Path | Tech stack | Details |
| :--- | :--- | :--- | :--- |
| **ResumeCraft AI** | [`examples/saasify-suite`](./examples/saasify-suite) | React, Vite, TS | Product user directory, tier keys, credit grants, streaming AI tools |
| **MindSpire Studio** | [`examples/mindspire-studio`](./examples/mindspire-studio) | React, Vite, TS | User AI Wallet connection via OAuth PKCE, model selection, streaming |
| **Node.js scripts** | [`examples/node-scripts`](./examples/node-scripts) | Node.js, TS | Standalone CLI scripts for inference streaming, user provisioning, and credit grants |

## Quickstart for backend and full-stack (`@zorveus/sdk`)

Install the SDK:

```bash
npm install @zorveus/sdk
```

### Organization management (`ZorveusServiceClient`)

Anchor product user operations to your SaaS user identifiers (`externalUserId`):

```typescript
import { ZorveusServiceClient } from "@zorveus/sdk";

const zorveus = new ZorveusServiceClient({
  apiKey: process.env.ZORVEUS_SERVICE_KEY
});

const appId = "app_startup_123";
const externalUserId = "usr_sara_101";

// Create or update user profile
const user = await zorveus.productUsers.createOrUpdate({
  appId,
  externalUserId,
  displayName: "Sara Connor",
  email: "sara@example.com"
});

// Issue promotional AI credits
await zorveus.productUsers.grantCreditByExternalId({
  appId,
  externalUserId,
  amount: "25.000000000000",
  source: "promotion",
  reason: "Welcome Bonus"
});

// Query user credit grants ledger
const ledger = await zorveus.productUsers.listCreditGrantsByExternalId({
  appId,
  externalUserId
});
```

### AI inference client (`Zorveus`)

```typescript
import { Zorveus } from "@zorveus/sdk";

const client = new Zorveus({
  apiKey: process.env.ZORVEUS_INFERENCE_KEY
});

// Stream completions with user attribution
const stream = await client.chat.completions.create({
  model: "openai/gpt-4.1-mini",
  messages: [{ role: "user", content: "Write a headline for a coffee shop." }],
  stream: true,
  zorveusMetadata: { externalUserId: "usr_sara_101" }
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || "");
}
```

## Quickstart for React (`@zorveus/react`)

Install React package:

```bash
npm install @zorveus/react @zorveus/sdk
```

Wrap your application tree in `<ZorveusProvider>`:

```tsx
import React from "react";
import {
  ZorveusProvider,
  OAuthCallbackHandler,
  ConnectWalletButton,
  useZorveusAuth,
  useZorveusInference,
  useZorveusModels
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

## Local development

```bash
npm install
npm run typecheck
npm test
npm run build
```

## License

MIT © [Zorveus Inc.](https://zorveus.com)
