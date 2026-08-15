# `@zorveus/sdk` TypeScript / JavaScript SDK Specification

Official TypeScript/JavaScript SDK specification for **Zorveus**. Provides a dual-plane client for both the OpenAI-compatible inference gateway and the Zorveus management control plane.

---

## 1. Package Metadata & Installation

```json
{
  "name": "@zorveus/sdk",
  "version": "0.1.0",
  "description": "Official TypeScript/JavaScript SDK for Zorveus AI Gateway and Management API",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.mjs"
      },
      "require": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      }
    }
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "sideEffects": false
}
```

### Runtime Compatibility
- **Node.js**: 18.0+
- **Runtimes**: Cloudflare Workers, Vercel Edge, Deno, Bun, Electron, Modern Browsers
- **HTTP Transport**: Standard `fetch` (native Web API, zero third-party networking dependencies)

---

## 2. Client Initialization

```typescript
import { Zorveus } from "@zorveus/sdk";

// 1. Inference Gateway Mode (using Inference Key or OAuth Access Token)
const zorveus = new Zorveus({
  apiKey: process.env.ZORVEUS_INFERENCE_KEY, // 'zrv_live_...' or 'zrv_oauth_...'
});

// 2. Control Plane Management Mode (using Service Key)
const zorveusAdmin = new Zorveus({
  apiKey: process.env.ZORVEUS_SERVICE_KEY, // 'zrv_service_...'
  baseURL: "https://api.zorveus.com", // Optional, defaults to production
});

// 3. Advanced Configuration Options
const customClient = new Zorveus({
  apiKey: "zrv_...",
  baseURL: "https://api.zorveus.com",
  gatewayBaseURL: "https://api.zorveus.com/v1",
  timeout: 30000, // 30 seconds
  maxRetries: 2,
  defaultHeaders: {
    "X-Custom-Client-Id": "my-saas-backend",
  },
});
```

---

## 3. Data Plane: Inference Gateway (`zorveus.chat`, `zorveus.embeddings`, `zorveus.models`)

### A. Standard Chat Completion with Inline Attribution

```typescript
const response = await zorveus.chat.completions.create({
  model: "openai/gpt-4o",
  messages: [
    { role: "system", content: "You are a helpful data analyst." },
    { role: "user", content: "Analyze monthly ARR growth." }
  ],
  temperature: 0.7,
  // Zorveus inline product-user attribution:
  zorveusMetadata: {
    externalUserId: "usr_ext_8842",
    displayName: "Jane Doe",
    userEmail: "jane@startup.com",
    metadata: {
      plan: "pro_tier",
      teamId: "team_402"
    }
  }
});

console.log(response.choices[0].message.content);
console.log(`Tokens: ${response.usage?.total_tokens}`);
```

### B. Streaming Completion (Server-Sent Events)

```typescript
const stream = await zorveus.chat.completions.create({
  model: "anthropic/claude-3-5-sonnet",
  messages: [{ role: "user", content: "Stream a 3-paragraph summary." }],
  stream: true,
  zorveusMetadata: {
    externalUserId: "usr_ext_8842"
  }
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content || "";
  process.stdout.write(content);
}
```

### C. Embeddings & Model Discovery

```typescript
// Create Embeddings
const embeddingResponse = await zorveus.embeddings.create({
  model: "openai/text-embedding-3-small",
  input: ["Semantic search query", "Target documentation chunk"]
});

// List Available Models on Gateway
const models = await zorveus.models.list({ routeStatus: "available" });
console.log(models.data.map(m => m.id));
```

---

## 4. Control Plane: Management API

### A. Product Users & Credit Grants (`zorveus.productUsers`)

```typescript
// 1. Create or Update a Product User
const user = await zorveus.productUsers.createOrUpdate({
  orgId: "org_startup_123",
  externalUserId: "usr_ext_8842",
  displayName: "Jane Doe",
  email: "jane@startup.com",
  metadata: { tier: "enterprise" }
});

// 2. Grant Startup-Funded AI Credits
const grant = await zorveus.productUsers.grantCredit(user.id, {
  orgId: "org_startup_123",
  appId: "app_789",
  amount: "25.0000", // Decimal string for financial safety
  currency: "USD",
  reason: "Monthly enterprise credit allowance",
  expiresAt: "2026-12-31T23:59:59Z"
});

// 3. List Credit Grants for User
const grants = await zorveus.productUsers.listCreditGrants(user.id, {
  orgId: "org_startup_123"
});

// 4. Revoke a Credit Grant
await zorveus.productUsers.revokeCredit(user.id, grant.id, {
  orgId: "org_startup_123"
});
```

### B. Bring Your Own Key / Provider Credentials (`zorveus.providerCredentials`)

```typescript
// Register an OpenAI BYOK Credential
const credential = await zorveus.providerCredentials.create({
  orgId: "org_startup_123",
  provider: "openai",
  credentialName: "Primary OpenAI Production Key",
  apiKey: "sk-proj-...",
  modelPolicies: ["openai/*"]
});

// List Active Provider Credentials
const list = await zorveus.providerCredentials.list({
  orgId: "org_startup_123",
  status: "active"
});
```

### C. Wallet & Ledger (`zorveus.wallet`)

```typescript
// 1. Get Wallet Balance & Reserved Funds
const overview = await zorveus.wallet.getOverview({ orgId: "org_startup_123" });
console.log(`Available Balance: $${overview.available_balance}`);
console.log(`Reserved In-Flight: $${overview.reserved_balance}`);

// 2. Query Wallet Ledger Transactions
const ledger = await zorveus.wallet.getLedger(overview.wallet_id, {
  orgId: "org_startup_123",
  limit: 50,
  offset: 0
});
```

### D. Spending Caps (`zorveus.caps`)

```typescript
// Set Hard Monthly Spending Cap on an App Connection
const cap = await zorveus.caps.create({
  orgId: "org_startup_123",
  targetType: "app_connection",
  targetId: "conn_456",
  limitAmount: "100.0000",
  period: "monthly"
});

// List Active Caps
const activeCaps = await zorveus.caps.list({
  orgId: "org_startup_123"
});
```

### E. Usage & Cost Analytics (`zorveus.usage`)

```typescript
const usageSummary = await zorveus.usage.query({
  orgId: "org_startup_123",
  startDate: "2026-08-01T00:00:00Z",
  endDate: "2026-08-13T23:59:59Z",
  appIds: ["app_789"],
  groupBy: ["model", "external_user_id"]
});
```

---

## 5. OAuth PKCE Helper Utilities (`ZorveusOAuth`)

Isomorphic utilities implementing RFC 7636 PKCE using standard Web Crypto (`crypto.subtle`):

```typescript
import { ZorveusOAuth } from "@zorveus/sdk";

// 1. Generate PKCE Verifier, Challenge, and CSRF State
const { codeVerifier, codeChallenge, state } = await ZorveusOAuth.generatePKCE();

// 2. Build the Zorveus Consent URL
const authorizationUrl = ZorveusOAuth.getAuthorizationUrl({
  clientId: "zrv_client_123",
  redirectUri: "https://myapp.com/api/oauth/callback",
  state,
  codeChallenge,
  scopes: ["inference:read", "inference:write"]
});

// 3. Server-side Token Exchange
const tokenResponse = await ZorveusOAuth.exchangeToken({
  clientId: "zrv_client_123",
  clientSecret: "zrv_secret_456", // Optional for public clients
  code: "auth_code_from_callback",
  codeVerifier,
  redirectUri: "https://myapp.com/api/oauth/callback"
});

console.log(`Inference Key: ${tokenResponse.access_token}`);
console.log(`Funding Org ID: ${tokenResponse.funding_org_id}`);
```

---

## 6. TypeScript Type Definitions

```typescript
export interface ZorveusClientOptions {
  apiKey: string;
  baseURL?: string;
  gatewayBaseURL?: string;
  timeout?: number;
  maxRetries?: number;
  defaultHeaders?: Record<string, string>;
  fetch?: typeof globalThis.fetch;
}

export interface ZorveusMetadata {
  externalUserId?: string;
  displayName?: string;
  userEmail?: string;
  metadata?: Record<string, unknown>;
}

export interface ChatCompletionCreateParams {
  model: string;
  messages: Array<{
    role: "system" | "user" | "assistant" | "tool";
    content: string;
    name?: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
  zorveusMetadata?: ZorveusMetadata;
}

export interface ProductUser {
  id: string;
  org_id: string;
  external_user_id: string;
  display_name: string | null;
  email: string | null;
  status: "active" | "suspended";
  created_at: string;
  updated_at: string;
}

export interface CreditGrant {
  id: string;
  product_user_id: string;
  org_id: string;
  app_id: string;
  amount: string; // Decimal string
  currency: string;
  reason: string | null;
  status: "active" | "exhausted" | "expired" | "revoked";
  expires_at: string | null;
  created_at: string;
}

export interface WalletOverview {
  wallet_id: string;
  org_id: string;
  available_balance: string; // Decimal string
  reserved_balance: string;  // Decimal string
  currency: string;
  updated_at: string;
}
```

---

## 7. Error Handling

```typescript
import { Zorveus, AuthenticationError, CapExceededError, InsufficientFundsError } from "@zorveus/sdk";

const zorveus = new Zorveus({ apiKey: "zrv_..." });

try {
  const response = await zorveus.chat.completions.create({
    model: "openai/gpt-4o",
    messages: [{ role: "user", content: "Hello" }]
  });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error("Invalid Zorveus API Key.");
  } else if (error instanceof CapExceededError) {
    console.error(`Spending limit exceeded: ${error.message}`);
  } else if (error instanceof InsufficientFundsError) {
    console.error("Wallet balance exhausted. Please top up your Zorveus balance.");
  } else {
    console.error("API error:", error);
  }
}
```
