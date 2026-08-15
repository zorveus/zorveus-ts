# @zorveus/sdk

The official TypeScript and JavaScript client library for the [Zorveus](https://zorveus.com) AI Infrastructure Platform.

---

## 📦 Key Capabilities

- **Unified AI Gateway & Streaming**: OpenAI-compatible chat completions across OpenAI, Anthropic, Gemini, DeepSeek, and more.
- **Product User Management & Credit Grants**: Manage spend limits, query live balances, and issue promotional AI credits using your application's `external_user_id`.
- **Live Model Discovery**: Query accessible models for any inference key with `client.models.list({ routeStatus: "available" })`.
- **Live Spend Cap Tracking**: Real-time spending, monthly budget caps, and remaining allowances with `client.getUsage()`.
- **OAuth 2.0 PKCE Helpers**: Complete PKCE authorization and token exchange utilities for user-owned AI wallet connections.
- **Provider Credentials Management**: Securely store and route BYOK foundation model provider keys.

---

## 🚀 Installation

```bash
npm install @zorveus/sdk
```

---

## 🔑 Client Types

`@zorveus/sdk` provides two specialized clients:

1. **`Zorveus`**: Client for AI inference, chat streaming, model discovery, and spend cap queries using an **Inference API Key** or **User OAuth Token**.
2. **`ZorveusServiceClient`**: Client for backend administration, product user provisioning, and credit grants using a **Master Organization Service Key** (`zrv_service_...`).

---

## ⚡ Quickstart 1: AI Inference & Streaming (`Zorveus`)

```typescript
import { Zorveus } from "@zorveus/sdk";

const client = new Zorveus({
  apiKey: process.env.ZORVEUS_INFERENCE_KEY // Direct inference key or user access token
});

// 1. Live Model Discovery (Zero Mock Fallbacks)
const models = await client.models.list({ routeStatus: "available" });
console.log(`Available models: ${models.data.map(m => m.id).join(", ")}`);

// 2. Real-Time Chat Streaming with User Attribution
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

// 3. Query Live Spend Cap & Usage (GET /inference-keys/usage)
const usage = await client.getUsage();
console.log(`Spent this period: $${usage.spent_this_period} / $${usage.spend_cap} ${usage.currency}`);
console.log(`Remaining balance: $${usage.remaining_balance}`);
```

---

## 🏢 Quickstart 2: Product Users & Credit Grants (`ZorveusServiceClient`)

Anchor all product user operations directly to your SaaS user identifiers (`external_user_id`), without needing Zorveus internal IDs or session cookies.

```typescript
import { ZorveusServiceClient } from "@zorveus/sdk";

const zorveus = new ZorveusServiceClient({
  apiKey: process.env.ZORVEUS_SERVICE_KEY // Master Service Key: zrv_svc_...
});

const appId = "app_startup_123";
const externalUserId = "usr_sara_101";

// 1. Auto-Provision or Upsert User Profile
const profile = await zorveus.productUsers.createOrUpdate({
  appId,
  externalUserId,
  displayName: "Sara Connor",
  email: "sara@example.com",
  metadata: { plan: "Pro", tier: "Growth" }
});

console.log("Status:", profile.product_user.status);
console.log("Live Balance:", profile.product_user.credits?.available_credits);

// 2. Grant Promotional AI Credits (Using External ID)
const grantRes = await zorveus.productUsers.grantCreditByExternalId({
  appId,
  externalUserId,
  amount: "25.000000000000", // Strict decimal string
  currency: "USD",
  source: "promotion",       // 'admin_adjustment' | 'promotion' | 'purchase' | 'monthly_allowance' | 'support_credit'
  reason: "Welcome Growth Bonus"
});

console.log("Issued Grant ID:", grantRes.credit_grant.credit_grant_id);
console.log("New Balance:", grantRes.credit_summary.remaining_balance);

// 3. Query User's Credit Grants Ledger (Using External ID)
const ledger = await zorveus.productUsers.listCreditGrantsByExternalId({
  appId,
  externalUserId,
  status: "active" // Optional: 'active' | 'exhausted' | 'expired' | 'revoked'
});

for (const grant of ledger.credit_grants) {
  console.log(`- Grant $${grant.amount} (${grant.source}): ${grant.reason}`);
}

// 4. Query Lightweight Credit Summary
const summary = await zorveus.productUsers.getCreditSummaryByExternalId({
  appId,
  externalUserId,
  currency: "USD"
});

console.log("Available Credits:", summary.available_credits);
console.log("Expiring Soon:", summary.expiring_soon_amount);
```

---

## 🔐 Quickstart 3: OAuth 2.0 PKCE Authentication (`ZorveusOAuth`)

```typescript
import { ZorveusOAuth } from "@zorveus/sdk";

// Step 1: Generate PKCE parameters
const pkce = ZorveusOAuth.generatePKCE();

// Step 2: Generate authorization URL for user consent
const authUrl = ZorveusOAuth.generateAuthUrl({
  clientId: "zrv_client_123456",
  redirectUri: "https://yourapp.com/oauth/callback",
  codeChallenge: pkce.codeChallenge,
  state: pkce.state,
  scopes: ["inference:write", "models:*"]
});

// Redirect user to authUrl...

// Step 3: Exchange authorization code for Access Token
const tokenData = await ZorveusOAuth.exchangeToken({
  clientId: "zrv_client_123456",
  code: callbackCode,
  codeVerifier: pkce.codeVerifier,
  redirectUri: "https://yourapp.com/oauth/callback"
});

console.log("User Access Token:", tokenData.access_token);
console.log("App Connection ID:", tokenData.app_connection_id);
```

---

## 📚 Complete API Reference

### `Zorveus` (Inference Client)
| Method | Description |
| :--- | :--- |
| `client.chat.completions.create(params)` | Create streaming or non-streaming chat completions with model routing and metadata attribution |
| `client.models.list(params)` | List accessible foundation models (`GET /v1/models?route_status=available`) |
| `client.getUsage(options)` | Query live spend cap, period spend, and remaining allowance (`GET /inference-keys/usage`) |

### `ZorveusServiceClient.productUsers` (Product Users & Credits)
| Method | Description |
| :--- | :--- |
| `createOrUpdate(params)` | Upsert product user by external ID (`PUT /product-users/by-external-id`) |
| `getByExternalId(params)` | Get product user profile with live cap & credit summary (`GET /product-users/by-external-id`) |
| `getCreditSummaryByExternalId(params)` | Fetch aggregated live credit balance (`GET /product-users/by-external-id/credit-summary`) |
| `listCreditGrantsByExternalId(params)` | Query user's credit grants ledger (`GET /product-users/by-external-id/credit-grants`) |
| `grantCreditByExternalId(params)` | Issue credits anchored to external ID (`POST /product-users/by-external-id/credit-grants`) |
| `list(params)` | List organization product users (`GET /product-users`) |
| `revokeCredit(userIdentifier, grantId)` | Revoke active grant (`POST /product-users/{id}/credit-grants/{grantId}/revoke`) |

### `ZorveusServiceClient.providerCredentials` (BYOK Management)
| Method | Description |
| :--- | :--- |
| `create(params)` | Store encrypted provider credential (OpenAI, Anthropic, Gemini, DeepSeek, etc.) |
| `list(params)` | List registered provider credentials |
| `get(credentialId)` | Get credential metadata |
| `delete(credentialId)` | Revoke provider credential |

### `ZorveusOAuth` (OAuth PKCE Utilities)
| Method | Description |
| :--- | :--- |
| `generatePKCE()` | Generates cryptographically secure `codeVerifier`, `codeChallenge`, and `state` |
| `generateAuthUrl(params)` | Generates OAuth 2.0 authorization URL |
| `validateCallback(params)` | Validates callback code and anti-CSRF state token |
| `exchangeToken(params)` | Exchanges authorization code for Bearer access token |
| `revokeToken(params)` | Revokes connection or access token |

---

## 🛡️ Error Handling

The SDK exposes strongly-typed errors for easy handling:

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

---

## 📄 License

MIT © [Zorveus Inc.](https://zorveus.com)
