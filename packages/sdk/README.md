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
| `ZorveusServiceClient` | `@zorveus/sdk` | Product users, credits, BYOK credentials, and usage events | Organization service key |
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
  model: "openai/gpt-4.1-mini",
  messages: [{ role: "user", content: "Reply with OK" }],
  zorveusMetadata: attribution
});
```

You can pass `productEndUserId` instead of `externalUserId` when you already know the Zorveus product-user ID.

### Stream a chat completion

```typescript
const stream = await client.chat.completions.create({
  model: "openai/gpt-4.1-mini",
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
  model: "openai/gpt-4.1-mini",
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
  model: zorveus("openai/gpt-4.1-mini"),
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
  reason: "Welcome credit"
});

console.log(profile.product_user.product_end_user_id);
console.log(grant.credit_summary.available_credits);
```

The product-user resource provides these methods:

| Method | Operation |
| --- | --- |
| `createOrUpdate(params)` | Create or update a user by external ID |
| `upsert(params)` | Alias for `createOrUpdate()` |
| `get(productEndUserId)` | Get a user by Zorveus product-user ID |
| `getByExternalId(params)` | Get a user by external ID |
| `list(params)` | List product users |
| `getCreditSummaryByExternalId(params)` | Get the credit balance and consumption summary |
| `grantCredit(productEndUserId, params)` | Grant credit by Zorveus product-user ID |
| `grantCreditByExternalId(params)` | Grant credit by external ID |
| `listCreditGrants(userIdentifier, params)` | List grants by user identifier |
| `listCreditGrantsByExternalId(params)` | List grants by external ID |
| `revokeCredit(productEndUserId, grantId)` | Revoke an active grant |

## Manage BYOK credentials

```typescript
const credential = await service.providerCredentials.create({
  provider: "openai",
  credentialName: "Production OpenAI",
  apiKey: process.env.OPENAI_API_KEY!
});
```

The provider-credential resource provides these methods:

| Method | Operation |
| --- | --- |
| `create(params)` | Store an encrypted provider credential |
| `list(params)` | List provider credentials |
| `get(credentialId)` | Get credential metadata |
| `rotate(credentialId, params)` | Replace the stored secret |
| `delete(credentialId)` | Delete the credential |
| `listProviders()` | List supported providers and authentication types |

## Read finance usage events

```typescript
import { normalInputTokens } from "@zorveus/sdk";

const page = await service.usageEvents.list({
  orgId: "org_123",
  appId: "app_123",
  limit: 50
});

for (const event of page.events) {
  console.log({
    virtualSpend: event.virtual_spend,
    walletCharge: event.sell_cost,
    providerCost: event.provider_cost,
    cacheSavings: event.cache_savings,
    normalInputTokens: normalInputTokens(event)
  });
}
```

`usageEvents.list()` accepts organization, app, connection, product-user, model, provider, billing-mode, status, time, limit, and cursor filters.

Money values are decimal strings. Keep them as strings or use a decimal-number library. Do not use `parseFloat()` for financial calculations. `normalInputTokens()` returns `null` unless the provider supplied a valid cache breakdown.

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
    model: "openai/gpt-4.1-mini",
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
