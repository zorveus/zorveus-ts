# Zorveus Node.js automation scripts

Standalone TypeScript scripts demonstrating `@zorveus/sdk` in Node.js backend environments.

## Included scripts

1. **`inference-demo.ts`**: Non-streaming and streaming chat completions across foundation models.
2. **`management-demo.ts`**: Product user provisioning, profile inspection, credit grants, and ledger queries.
3. **`oauth-pkce-demo.ts`**: OAuth 2.0 PKCE authorization URL generation, state validation, and token exchange.

## How to run

### Option 1: Run via root npm scripts

From the monorepo root:

```bash
# Run AI inference demo
npm run demo:node

# Run product user and credit management demo
npm run demo:management

# Run OAuth PKCE demo
npm run demo:oauth
```

### Option 2: Run directly with custom environment variables

Set your keys before running:

```bash
export ZORVEUS_INFERENCE_KEY="zrv_live_..."
export ZORVEUS_SERVICE_KEY="zrv_svc_..."

npx tsx examples/node-scripts/inference-demo.ts
npx tsx examples/node-scripts/management-demo.ts
npx tsx examples/node-scripts/oauth-pkce-demo.ts
```

> [!NOTE]
> `oauth-pkce-demo.ts` passes `scopes: ["inference:write", "models:*"]`. The Zorveus OAuth consent backend requires at least one model scope (`models:*`) to grant user inference authorization.

## License

MIT © [Zorveus Inc.](https://zorveus.com)
