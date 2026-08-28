# `@zorveus/sdk`

Official TypeScript and JavaScript client library for the [Zorveus](https://zorveus.com) AI platform.

## Features

- **AI Gateway and streaming**: OpenAI-compatible chat completions across OpenAI, Anthropic, Gemini, DeepSeek, and custom models.
- **Product User management and credit grants**: Track spend limits, query live balances, and grant promotional credits using `externalUserId`.
- **Model discovery**: Query available models for an inference key with `client.models.list({ routeStatus: "available" })`.
- **Spend tracking**: Real-time spending and remaining balance queries with `client.getUsage()`.
- **OAuth 2.0 PKCE utilities**: PKCE parameters generation, authorization URL construction, and token exchange helpers.
- **Provider credentials management**: Store and route provider keys.

## Installation

```bash
npm install @zorveus/sdk
```

## Client types

`@zorveus/sdk` exports two clients:

1. **`Zorveus`**: Client for AI inference, chat streaming, model discovery, and usage queries using an Inference API key or user OAuth access token.
2. **`ZorveusServiceClient`**: Client for administration, product user provisioning, and credit grants using an Organization service key (`zrv_svc_...`).

## Quickstart for AI inference and streaming (`Zorveus`)

```typescript
import { Zorveus } from "@zorveus/sdk";

const client = new Zorveus({
  apiKey: process.env.ZORVEUS_INFERENCE_KEY
});

// List available models
const models = await client.models.list({ routeStatus: "available" });
console.log(`Available models: ${models.data.map(m => m.id).join(", ")}`);

// Stream completions with user attribution
const stream = await client.chat.completions.create({
  model: "openai/gpt-4.1-mini",
  messages: [
    { role: "system", content: "You are an expert career strategist." },
    { role: "user", content: "Write a high-converting executive summary bullet." }
  ],
  stream: true,
  zorveusMetadata: {
    externalUserId: "usr_sara_101",
    displayName: "Sara Connor",
    userEmail: "sara@example.com"
  }
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || "");
}

// Query current usage and spend cap
const usage = await client.getUsage();
console.log(`Spent this period: $${usage.spent_this_period} / $${usage.spend_cap} ${usage.currency}`);
console.log(`Remaining balance: $${usage.remaining_balance}`);
```

## Quickstart for product users and credit grants (`ZorveusServiceClient`)

Anchor product user operations to your SaaS user identifiers (`externalUserId`):

```typescript
import { ZorveusServiceClient } from "@zorveus/sdk";

const zorveus = new ZorveusServiceClient({
  apiKey: process.env.ZORVEUS_SERVICE_KEY
});

const appId = "app_startup_123";
const externalUserId = "usr_sara_101";

// Create or update user profile
const profile = await zorveus.productUsers.createOrUpdate({
  appId,
  externalUserId,
  displayName: "Sara Connor",
  email: "sara@example.com",
  metadata: { plan: "Pro", tier: "Growth" }
});

console.log("Status:", profile.product_user.status);
console.log("Live Balance:", profile.product_user.credits?.available_credits);

// Grant promotional credits
const grantRes = await zorveus.productUsers.grantCreditByExternalId({
  appId,
  externalUserId,
  amount: "25.000000000000",
  currency: "USD",
  source: "promotion",
  reason: "Welcome Growth Bonus"
});

console.log("Issued Grant ID:", grantRes.credit_grant.credit_grant_id);
console.log("New Balance:", grantRes.credit_summary.remaining_balance);

// Query user credit grants ledger
const ledger = await zorveus.productUsers.listCreditGrantsByExternalId({
  appId,
  externalUserId,
  status: "active"
});

for (const grant of ledger.credit_grants) {
  console.log(`- Grant $${grant.amount} (${grant.source}): ${grant.reason}`);
}

// Query credit summary
const summary = await zorveus.productUsers.getCreditSummaryByExternalId({
  appId,
  externalUserId,
  currency: "USD"
});

console.log("Available credits:", summary.available_credits);
console.log("Expiring soon:", summary.expiring_soon_amount);
```

## Quickstart for OAuth 2.0 PKCE authentication (`ZorveusOAuth`)

```typescript
import { ZorveusOAuth } from "@zorveus/sdk";

// Generate PKCE parameters
const pkce = ZorveusOAuth.generatePKCE();

// Generate authorization URL for user consent
const authUrl = ZorveusOAuth.generateAuthUrl({
  clientId: "zrv_client_123456",
  redirectUri: "https://yourapp.com/oauth/callback",
  codeChallenge: pkce.codeChallenge,
  state: pkce.state,
  scopes: ["inference:write", "models:*"]
});

// Exchange authorization code for Access Token
const tokenData = await ZorveusOAuth.exchangeToken({
  clientId: "zrv_client_123456",
  code: callbackCode,
  codeVerifier: pkce.codeVerifier,
  redirectUri: "https://yourapp.com/oauth/callback"
});

console.log("User access token:", tokenData.access_token);
console.log("App connection ID:", tokenData.app_connection_id);
```

> [!NOTE]
> OAuth authorization requests require at least one model scope such as `models:*` alongside `inference:write`. Omitting model scopes triggers a `zorveus_model_scope_required` authorization error.

## API reference

### `Zorveus` (Inference client)

| Method | Description |
| :--- | :--- |
| `client.chat.completions.create(params)` | Create streaming or non-streaming chat completions with model routing and metadata attribution |
| `client.models.list(params)` | List accessible foundation models (`GET /v1/models?route_status=available`) |
| `client.getUsage(options)` | Query live spend cap, period spend, and remaining allowance (`GET /inference-keys/usage`) |

### `ZorveusServiceClient.productUsers` (Product users and credits)

| Method | Description |
| :--- | :--- |
| `createOrUpdate(params)` | Upsert product user profile by external ID (`PUT /product-users/by-external-id`) |
| `getByExternalId(params)` | Get product user profile with cap and credit summary (`GET /product-users/by-external-id`) |
| `getCreditSummaryByExternalId(params)` | Fetch aggregated credit balance (`GET /product-users/by-external-id/credit-summary`) |
| `listCreditGrantsByExternalId(params)` | Query user credit grants ledger (`GET /product-users/by-external-id/credit-grants`) |
| `grantCreditByExternalId(params)` | Issue credits anchored to external ID (`POST /product-users/by-external-id/credit-grants`) |
| `list(params)` | List organization product users (`GET /product-users`) |
| `revokeCredit(userIdentifier, grantId)` | Revoke active grant (`POST /product-users/{id}/credit-grants/{grantId}/revoke`) |

### `ZorveusServiceClient.providerCredentials` (BYOK management)

| Method | Description |
| :--- | :--- |
| `create(params)` | Store encrypted provider credential (OpenAI, Anthropic, Gemini, DeepSeek, etc.) |
| `list(params)` | List registered provider credentials |
| `get(credentialId)` | Get credential metadata |
| `delete(credentialId)` | Revoke provider credential |

### `ZorveusOAuth` (OAuth PKCE utilities)

| Method | Description |
| :--- | :--- |
| `generatePKCE()` | Generates cryptographically secure `codeVerifier`, `codeChallenge`, and `state` |
| `generateAuthUrl(params)` | Generates OAuth 2.0 authorization URL |
| `validateCallback(params)` | Validates callback code and anti-CSRF state token |
| `exchangeToken(params)` | Exchanges authorization code for Bearer access token |
| `revokeToken(params)` | Revokes connection or access token |

## Error handling

The SDK exposes error classes for error handling:

```typescript
import { ZorveusError, AuthenticationError, RateLimitError, InvalidDecimalError } from "@zorveus/sdk";

try {
  await zorveus.productUsers.grantCreditByExternalId({ ... });
} catch (error) {
  if (error instanceof InvalidDecimalError) {
    console.error("Amount must be a valid decimal string (e.g. '25.00')");
  } else if (error instanceof AuthenticationError) {
    console.error("Invalid API Key or Service Key");
  } else if (error instanceof RateLimitError) {
    console.error("Rate limit exceeded");
  } else if (error instanceof ZorveusError) {
    console.error(`Zorveus Error (${error.status}):`, error.message);
  }
}
```

## License

MIT © [Zorveus Inc.](https://zorveus.com)
