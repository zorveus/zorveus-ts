# @zorveus/sdk

The official TypeScript/JavaScript client library for [Zorveus](https://zorveus.com).

Provides full support for:
- **Inference & AI Gateway**: OpenAI-compatible chat completions and streaming across OpenAI, Anthropic, Gemini, DeepSeek, and more.
- **Product Users & Credit Grants**: Manage end-user spend caps, credit balances, and usage tracking.
- **Provider Credentials**: Store and manage BYOK foundation model provider keys securely.
- **OAuth 2.0 PKCE**: Seamless user AI wallet authorization flows.

---

## Installation

```bash
npm install @zorveus/sdk
```

---

## Quickstart: AI Inference & Streaming

```typescript
import { Zorveus } from "@zorveus/sdk";

const client = new Zorveus({
  apiKey: process.env.ZORVEUS_INFERENCE_KEY // User token or direct API key
});

// 1. Non-Streaming Chat Completion
const response = await client.chat.completions.create({
  model: "openai/gpt-4.1-mini",
  messages: [{ role: "user", content: "Explain quantum computing simply." }]
});

console.log(response.choices[0].message.content);

// 2. Real-Time Streaming
const stream = await client.chat.completions.create({
  model: "openai/gpt-4.1-mini",
  messages: [{ role: "user", content: "Write a short poem." }],
  stream: true
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || "");
}

// 3. Query Live Spend Cap & Usage (GET /inference-keys/usage)
const usage = await client.getUsage();
console.log("Spent this period:", usage.spent_this_period, usage.currency);
console.log("Spend Cap:", usage.spend_cap);
console.log("Remaining Balance:", usage.remaining_balance);
```

---

## Quickstart: Startup Backend Management

Use `ZorveusServiceClient` with your master Organization Service Key (`zrv_service_...`):

```typescript
import { ZorveusServiceClient } from "@zorveus/sdk";

const zorveus = new ZorveusServiceClient({
  apiKey: process.env.ZORVEUS_SERVICE_KEY
});

// 1. Fetch complete product user profile by your SaaS external ID
const user = await zorveus.productUsers.getByExternalId({
  appId: "app_marketing_123",
  externalUserId: "usr_alex_8842"
});

console.log("Credit Balance:", user.credits?.available_credits);
console.log("Spend Cap:", user.cap?.amount);
console.log("Tokens this month:", user.usage?.this_month?.total_tokens);

// 2. Fetch lightweight credit summary
const summary = await zorveus.productUsers.getCreditSummaryByExternalId({
  appId: "app_marketing_123",
  externalUserId: "usr_alex_8842"
});

console.log("Available:", summary.available_credits);

// 3. Grant credits to user (strict financial decimal precision)
await zorveus.productUsers.grantCredit(user.product_end_user_id, {
  appId: "app_marketing_123",
  amount: "25.000000000000",
  reason: "Welcome bonus"
});
```

---

## Quickstart: OAuth 2.0 PKCE Helpers

```typescript
import { ZorveusOAuth } from "@zorveus/sdk";

// 1. Generate PKCE parameters
const pkce = ZorveusOAuth.generatePKCE();

// 2. Generate authorization URL
const authUrl = ZorveusOAuth.generateAuthUrl({
  clientId: "zrv_client_123",
  redirectUri: "https://yourapp.com/oauth/callback",
  codeChallenge: pkce.codeChallenge,
  state: pkce.state,
  scopes: ["inference:write", "models:*"]
});

// 3. Exchange code for access token (server-side callback)
const tokenData = await ZorveusOAuth.exchangeToken({
  clientId: "zrv_client_123",
  clientSecret: process.env.ZORVEUS_CLIENT_SECRET, // optional for public clients
  code: callbackCode,
  codeVerifier: pkce.codeVerifier,
  redirectUri: "https://yourapp.com/oauth/callback"
});

console.log("Access Token:", tokenData.access_token);
```

---

## License

MIT © [Zorveus Inc.](https://zorveus.com)
