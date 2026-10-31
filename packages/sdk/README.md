# `@zorveus/sdk`

TypeScript and JavaScript clients for the Zorveus inference gateway and management API.

## Install the package

Install the core SDK:

```bash
npm install @zorveus/sdk
```

To use `ZorveusOpenAI`, also install the OpenAI SDK:

```bash
npm install @zorveus/sdk openai
```

To use the Vercel AI SDK adapter, also install its peer packages:

```bash
npm install @zorveus/sdk ai @ai-sdk/openai
```

## Pick the right client

The package provides these public clients and adapters:

| Export | Import | Use it for | Credential |
| --- | --- | --- | --- |
| `Zorveus` | `@zorveus/sdk` | Native inference, models, and inference-key usage | Inference key or OAuth access token |
| `ZorveusServiceClient` | `@zorveus/sdk` | Product users, credits, and allowance | Organization service key |
| `ZorveusOAuth` | `@zorveus/sdk` | OAuth PKCE authorization and token management | OAuth client credentials |
| `ZorveusOpenAI` | `@zorveus/sdk/openai` | The OpenAI JavaScript API pointed at Zorveus | Inference key or OAuth access token |
| `createZorveus` | `@zorveus/sdk/vercel` | Vercel AI SDK models pointed at Zorveus | Inference key or OAuth access token |

Never put an organization service key in browser code.

## Use the native inference client

Create one `Zorveus` instance and reuse it:

```typescript
import { Zorveus } from "@zorveus/sdk";

const client = new Zorveus({
  apiKey: process.env.ZORVEUS_INFERENCE_KEY!
});
```

The native client has these resources:

| Method | Result |
| --- | --- |
| `client.chat.completions.create(params)` | Streaming or non-streaming chat completion |
| `client.embeddings.create(params)` | Embedding vectors |
| `client.images.generate(params)` | Generated image URLs or base64 data |
| `client.audio.speech.create(params)` | A `Response` containing generated audio |
| `client.audio.speech(params)` | Shorthand for `audio.speech.create()` |
| `client.audio.transcriptions.create(params)` | Audio transcription |
| `client.models.list(params)` | Models available to the inference key |
| `client.models.retrieve(modelId)` | One model |
| `client.getUsage(options)` | The key's current spend, cap, and remaining allowance |

### Attribute usage to a product user

Pass `zorveusMetadata` on each native inference request:

```typescript
const attribution = {
  externalUserId: "customer-123",
  displayName: "Sara Connor",
  userEmail: "sara@example.com",
  metadata: { plan: "growth" }
};

const completion = await client.chat.completions.create({
  model: process.env.ZORVEUS_MODEL_ID!,
  messages: [{ role: "user", content: "Reply with OK" }],
  zorveusMetadata: attribution
});
```

You can pass `productEndUserId` instead of `externalUserId` when you already know the Zorveus product-user ID.

### Attach business context to usage

Use `zorveusMetadata.usageMetadata` for request activity. `zorveusMetadata.metadata` remains product-user profile data

```typescript
const result = await client.embeddings.create(
	{
		model: process.env.ZORVEUS_EMBEDDING_MODEL_ID!,
		input: "Text to embed",
		zorveusMetadata: {
			externalUserId: authenticatedUserId,
			usageMetadata: {
				activity_id: "index_123",
				activity_label: "Indexed document",
				document_id: "doc_123",
			},
		},
	},
	{ headers: { "X-Zorveus-Usage-Metadata": JSON.stringify({ channel: "documents" }) } },
);
```

Get `authenticatedUserId` from trusted application state. The same `zorveusMetadata.usageMetadata` option works on native chat calls, including streaming. The exported `UsageMetadata` type accepts JSON values

The gateway shallow-merges the header object with the body object. Body keys win, and a nested body object replaces the matching header object. Each input and the merged object must fit within 4,096 UTF-8 bytes using compact JSON encoding. The raw header also has a 4,096-byte limit. Invalid JSON, non-object values, non-finite numbers, and oversized data are rejected before a billing reservation is created

The backend captures this context for the resulting usage events and removes it before sending the provider request. `UsageEvent.usage_metadata` can be an object or `null`; older responses may omit the optional field. Existing dashboard permissions still apply, and diagnostic views without usage-detail permission redact it. Completion and embedding responses do not include the saved usage event

`activity_id` and `activity_label` are optional business-defined fields. They do not group events, deduplicate requests, or change prices. Use `service.productUsers.listActivityByExternalId()` for customer activity history. See the [raw HTTP and SDK examples](https://docs.zorveus.com/inference/product-user-metadata#attach-business-context-to-usage-events) for the shared contract

### Stream a chat completion

```typescript
const stream = await client.chat.completions.create({
  model: process.env.ZORVEUS_MODEL_ID!,
  messages: [{ role: "user", content: "Count from one to five" }],
  stream: true,
  zorveusMetadata: { externalUserId: "customer-123" }
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content ?? "");
}
```

### Create an embedding

```typescript
const result = await client.embeddings.create({
  model: "text-embedding-3-small",
  input: "Text to embed",
  zorveusMetadata: { externalUserId: "customer-123" }
});

console.log(result.data[0]?.embedding);
```

### Generate an image

```typescript
const result = await client.images.generate({
  model: "dall-e-3",
  prompt: "A geometric illustration of an AI gateway",
  size: "1024x1024",
  response_format: "url",
  zorveusMetadata: { externalUserId: "customer-123" }
});

console.log(result.data[0]?.url);
```

### Generate speech

`audio.speech.create()` returns a standard Fetch `Response` because the body contains binary audio:

```typescript
const response = await client.audio.speech.create({
  model: "tts-1",
  voice: "alloy",
  input: "Hello from Zorveus",
  response_format: "mp3",
  zorveusMetadata: { externalUserId: "customer-123" }
});

const audio = new Uint8Array(await response.arrayBuffer());
```

### Transcribe audio

```typescript
const transcript = await client.audio.transcriptions.create({
  model: "whisper-1",
  file: audioFile,
  zorveusMetadata: { externalUserId: "customer-123" }
});

console.log(transcript.text);
```

`audioFile` can be a browser `File` or another upload value supported by your runtime.

## Use the OpenAI adapter

`ZorveusOpenAI` extends the official `OpenAI` client. It keeps the OpenAI resource names and points them at the Zorveus gateway.

```typescript
import { ZorveusOpenAI } from "@zorveus/sdk/openai";

const openai = new ZorveusOpenAI({
  apiKey: process.env.ZORVEUS_INFERENCE_KEY!,
  externalUserId: "customer-123",
  displayName: "Sara Connor",
  userEmail: "sara@example.com"
});

const response = await openai.responses.create({
  model: process.env.ZORVEUS_MODEL_ID!,
  input: "Reply with OK"
});

console.log(response.output_text);
```

Constructor attribution applies to JSON and multipart requests. It covers chat, Responses, embeddings, speech, transcription, translation, images, moderation, and file uploads. Explicit request metadata overrides constructor defaults. Read-only requests such as `files.list()` do not create attributed inference usage.

All OpenAI resources still depend on the corresponding Zorveus gateway route and model being available.

## Use the Vercel AI SDK adapter

```typescript
import { streamText } from "ai";
import { createZorveus } from "@zorveus/sdk/vercel";

const zorveus = createZorveus({
  apiKey: process.env.ZORVEUS_INFERENCE_KEY!,
  externalUserId: "customer-123",
  displayName: "Sara Connor"
});

const result = streamText({
  model: zorveus(process.env.ZORVEUS_MODEL_ID!),
  prompt: "Reply with OK"
});

for await (const text of result.textStream) {
  process.stdout.write(text);
}
```

The adapter adds product-user attribution to every JSON request sent by the Vercel provider. Request metadata overrides constructor defaults.

## Manage product users and credits

Use `ZorveusServiceClient` only in trusted server code:

```typescript
import { ZorveusServiceClient } from "@zorveus/sdk";

const service = new ZorveusServiceClient({
  apiKey: process.env.ZORVEUS_SERVICE_KEY!
});

const profile = await service.productUsers.createOrUpdate({
  appId: "app_123",
  externalUserId: "customer-123",
  displayName: "Sara Connor",
  email: "sara@example.com"
});

const grant = await service.productUsers.grantCreditByExternalId({
  appId: "app_123",
  externalUserId: "customer-123",
  amount: "25.000000000000",
  currency: "USD",
  source: "promotion",
  reason: "Welcome credit",
  externalReference: "welcome:customer-123"
});

console.log(profile.product_user.product_end_user_id);
console.log(grant.credit_summary.available_credits);
```

The product-user resource provides these methods:

| Method | Operation |
| --- | --- |
| `createOrUpdate(params)` | Create or update a user by external ID |
| `upsert(params)` | Alias for `createOrUpdate()` |
| `getByExternalId(params)` | Get a user by external ID |
| `getAllowanceDebtByExternalId(params)` | Read carried allowance debt and repayments |
| `getCreditSummaryByExternalId(params)` | Get the credit balance and consumption summary |
| `grantCreditByExternalId(params)` | Grant credit by external ID |
| `getCreditGrantByExternalReference(params)` | Recover one grant by its durable reference |
| `listCreditGrantsByExternalId(params)` | List grants by external ID |

### Opt into creating missing users on reads

Product-user reads return HTTP 404 when the user is missing. Set `upsertIfMissing: true` to create one during the read:

```typescript
const profile = await service.productUsers.getByExternalId({
	appId: "app_123",
	externalUserId: authenticatedUserId,
	upsertIfMissing: true,
});
```

The `upsertIfMissing` parameter also works with `getCreditSummaryByExternalId`, `getAllowanceDebtByExternalId`, `listCreditGrantsByExternalId`, and `listActivityByExternalId`. Pass a boolean. The SDK sends `X-Zorveus-Upsert-Product-User` automatically. With no option or header, reads remain lookup-only. Explicit `false` overrides a conflicting request or client-default header. Existing raw-header calls remain supported when this parameter is omitted

Creation requires an owned, non-deleted app and the normal product-user read scope. Existing profiles and statuses are preserved. Explicit upsert and credit-grant writes retain their creation behavior

### List customer activity

```typescript
const page = await service.productUsers.listActivityByExternalId({
	appId: "app_123",
	externalUserId: authenticatedUserId,
	limit: 20,
});
for (const item of page.items) {
	console.log(item.label, item.amount, item.currency);
	if (item.type === "usage") {
		console.log(item.usage_metadata, item.credit_allocations);
	}
}
```

Optional filters are `type`, `from`, `to`, and `currency`. Pass `cursor: page.next_cursor!` only when `page.has_more`, retaining the same app, user, and filters. The limit defaults to 20 and accepts 1 to 100

The discriminated items combine AI usage with recorded permanent credit movements. Usage amounts are negative product-user charges after markup. Usage items include base allowance and credit breakdowns, uncovered amounts, and per-grant allocations with saved conversion metadata. Unknown historical base and uncovered portions are `null`. Monetary fields stay decimal strings

This customer-scoped endpoint uses `product_users:read`, returns 404 for missing users unless the upsert header is enabled, and does not expose organization wholesale costs. See [Product-user activity](https://docs.zorveus.com/startups/product-user-activity) for raw HTTP requests, complete responses, and UI rules

### Financial helper getters

`ProductUserResponse` (and its alias `ProductUser`) returned by `getByExternalId` provides helpers for calculating live spendable balances and caps:

- `getAvailableAllowance()`: Returns the total spendable amount right now across base allowance and promotional credits.
- `getTotalAvailableToSpend()`: Alias for `getAvailableAllowance()`.
- `getAvailableCredits()`: Returns spendable promotional credits.
- `getTotalCredits()`: Alias for `getAvailableCredits()`.
- `getTotalAllowance()`: Returns configured cap amount (`null` if uncapped). Ignores `direct_cap`.
- `getCapSpent()`: Returns amount spent against the active cap in the current period. Ignores `direct_cap`.
- `getRemainingBaseAllowance()`: Returns remaining base allowance before promotional credits are touched (`null` if not configured).
- `getUsageCost(period?)`: Returns sell cost for `"this_period"` (default) or `"total"`.
- `hasAvailableAllowance()`: Returns `true` if `parseFloat(getAvailableAllowance()) > 0`.

Convenience getter properties (`totalAvailableAllowance`, `totalAvailableToSpend`, `totalCredits`, `capSpent`) are also available.

Omit `allowanceStartsAt` to preserve an existing subscription anchor. Send an ISO 8601 timestamp to set it or `null` to clear it. For an increase between plan keys, send `zorveusMetadata: { externalUserId, allowanceChange: "prorate_increase" }` on inference and read `profile.allowance?.adjustment` after that request

### Recover an uncertain grant

Set `externalReference` to a stable purchase or award identifier when creating a grant. Repeating the same reference and grant parameters returns the same grant. Different parameters return HTTP 409 with `zorveus_product_user_credit_reference_conflict`. The reference belongs to the organization and app, so service-key rotation does not change it

```typescript
const grant = await service.productUsers.getCreditGrantByExternalReference({
	appId: "app_123", externalUserId: "customer-123",
	externalReference: "welcome:customer-123",
});
console.log(grant.credit_grant_id, grant.remaining_amount);
```

Lookup returns the grant directly, including its current balance and lifecycle status. It requires `product_users:read` or a scope that includes it. A lookup that returns 404 can race an unfinished creation. Repeat the original POST with the same reference and parameters to recover safely

The SDK does not enable automatic POST retries merely because a reference is present. Calls without a reference remain independent grants. Neither metadata nor an `idempotencyKey` option supplies this guarantee. Keep payment verification and durable purchase records in your backend. Use decimal strings for money. See [grant retry rules](https://docs.zorveus.com/platform/idempotency)

Configure app connections, inference keys, and BYOK credentials in the [dashboard](https://app.zorveus.com). Use the inference key with this SDK after setup

## Read usage

Use `client.getUsage()` for the inference key's current cap and spend. Use `service.productUsers.getByExternalId()` for customer allowance and usage. With a routing key, pass `{ headers: { "X-Zorveus-Key-Alias": "pro" } }` to `getUsage()` or as the second argument to `models.list()`

Detailed finance events require a dashboard session. `service.usageEvents.list()` rejects locally with `zorveus_dashboard_session_required` because an organization service key cannot authenticate that endpoint

## Use OAuth PKCE

```typescript
import { ZorveusOAuth } from "@zorveus/sdk";

const pkce = await ZorveusOAuth.generatePKCE();

const authorizationUrl = ZorveusOAuth.getAuthorizationUrl({
  clientId: "zrv_client_123",
  redirectUri: "https://example.com/oauth/callback",
  codeChallenge: pkce.codeChallenge,
  state: pkce.state,
  scopes: ["inference:write", "models:*"]
});

const callback = ZorveusOAuth.validateCallback({
  urlOrParams: callbackUrl,
  expectedState: pkce.state
});

if (!callback.valid || !callback.code) {
  throw new Error(callback.errorDescription ?? "OAuth callback failed");
}

const token = await ZorveusOAuth.exchangeToken({
  clientId: "zrv_client_123",
  code: callback.code,
  codeVerifier: pkce.codeVerifier,
  redirectUri: "https://example.com/oauth/callback"
});
```

OAuth methods:

| Method | Operation |
| --- | --- |
| `generatePKCE()` | Generate a verifier, challenge, and state value |
| `getAuthorizationUrl(params)` | Build the authorization URL |
| `validateCallback(options)` | Validate the callback and state value |
| `exchangeToken(params)` | Exchange an authorization code for an access token |
| `revokeToken(params)` | Revoke an access token or app connection |

Save the verifier and state before redirecting. Always pass the saved state to `validateCallback()`, including callbacks with an OAuth error. Public clients omit `clientSecret`; confidential backends supply it

```typescript
const revoked = await ZorveusOAuth.revokeToken({
  clientId: "zrv_client_123",
  token: storedAccessToken,
});
console.log(revoked.revoked);
```

A confirmed `revoked: false` can mean the connection was already revoked. Clear the local session after a confirmed response. On a network failure, remote revocation remains uncertain

OAuth authorization requires `inference:write` and at least one model scope such as `models:*`.

## Handle errors

The SDK maps finance and gateway failures to typed errors:

```typescript
import {
  CapExceededError,
  InsufficientFundsError,
  ProductUserAllowanceInsufficientError,
  ZorveusError
} from "@zorveus/sdk";

try {
  await client.chat.completions.create({
    model: process.env.ZORVEUS_MODEL_ID!,
    messages: [{ role: "user", content: "Hello" }]
  });
} catch (error) {
  if (error instanceof ProductUserAllowanceInsufficientError) {
    console.error("Allowance shortfall:", error.params?.shortfall);
  } else if (error instanceof InsufficientFundsError) {
    console.error("The organization wallet needs funds.");
  } else if (error instanceof CapExceededError) {
    console.error("The inference key or member cap was reached.");
  } else if (error instanceof ZorveusError) {
    console.error(error.status, error.code, error.message);
  }
}
```

Branch on the HTTP status and machine-readable `code`. Do not match error message text.

## Run the examples

From the repository root, open the interactive runner:

```bash
npm run demo:runner
```

Choose one operation, a comma-separated set, all read-only operations, or every operation with confirmation. OAuth has a separate browser-based example:

```bash
npm run demo:oauth
```

## License

MIT © Zorveus Inc.


## Product-user pricing

A business can configure a `product_user_charge_multiplier` on its app and override it on a plan's app connection. A connection override of null inherits the app default, and 1 applies no added markup. Configure these values through the dashboard or the authenticated management API

Select the customer's connection from trusted subscription data. Existing routing keys support this through `zorveusMetadata.keyAlias`, while `externalUserId` keeps the customer identity stable across plans

```typescript
const response = await client.chat.completions.create({
  model: configuredModel,
  messages,
  zorveusMetadata: {
    externalUserId: currentUser.id,
    keyAlias: verifiedSubscription.plan
  }
});
```

The backend saves the resolved multiplier when reserving the request. For example, an organization wallet charge of $0.001 can consume $0.002 of product-user allowance at 2×. This applies to attributed product users on programmatic connections. Requests without product-user attribution and OAuth connections retain their existing behavior

Usage records expose `product_user_charge_amount`, `product_user_charge_multiplier` and `product_user_charge_multiplier_source` separately from organization costs. Product-user usage buckets expose the summed `product_user_charge_amount`. The chat completion itself does not contain these billing fields

The remaining credit and allowance helpers still return USD amounts. To display business credit units, multiply each grant's remaining USD by that grant's saved `metadata.credits_per_usd`. The backend has already applied the charge multiplier, so applying it again to the displayed balance would double it

## Selected-key allowance reads and credit units

The service client can read a customer's allowance using the direct inference key or routing key selected by your application. Keep both credentials on your backend. The service key authorizes the read, while the inference key selects the policy through a header

```typescript
const user = await service.productUsers.getByExternalId({
	appId,
	externalUserId: authenticatedUserId,
	inferenceKey: selectedInferenceOrRoutingKey,
	keyAlias: selectedRoutingAlias,
	upsertIfMissing: true,
});
console.log(user.allowance?.remaining_credit_units);

const receipt = await service.productUsers.grantCreditByExternalId({
	appId,
	externalUserId: authenticatedUserId,
	externalReference: `purchase:${verifiedPayment.id}`,
	amount: "2.000000000000",
	creditUnitsPerUsd: "1500",
	source: "purchase",
});
```

Omit the alias for a direct key. Routing keys accept a member alias or their configured default. The upsert option enables the first read before any AI request. Changing the selected key reflects a new plan immediately without assigning a subscription inside Zorveus

`allowance.remaining_credit_units` includes base allowance at the current app rate plus applicable grants at their own rates. `credits.remaining_credit_units` and `credit_summary.remaining_credit_units` count grants only. Existing amount getters and USD fields retain their currency meaning

The $2 grant above starts with 3,000 units. Omit its rate to save the app default. A saved grant rate does not change when the app default changes. Older grants without a saved rate use the current app default. Include the same explicit rate when retrying a grant reference

Activity returns `charged_credit_units`, saved from the actual allocations at settlement. Later app-rate changes do not recalculate it. Rates and quantities are decimal strings. Quantities can have more than 12 decimal places, and null means unavailable rather than zero
