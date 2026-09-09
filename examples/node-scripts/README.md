# Zorveus Node.js automation scripts

Standalone TypeScript scripts demonstrating `@zorveus/sdk` in Node.js backend environments.

## Included scripts

1. **`inference-demo.ts`**: Compatibility entry point for the interactive SDK runner.
2. **`management-demo.ts`**: Compatibility entry point for the interactive SDK runner.
3. **`oauth-pkce-demo.ts`**: OAuth 2.0 PKCE authorization URL generation, state validation, and token exchange.
4. **`test-all.ts`**: Interactive SDK runner. Choose one operation by number, choose several with comma-separated numbers, or choose all.

## How to run

### Option 1: Run via root npm scripts

From the monorepo root:

```bash
# Open the interactive SDK runner
npm run demo:runner

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
export ZORVEUS_APP_ID="app_..."

npx tsx examples/node-scripts/inference-demo.ts
npx tsx examples/node-scripts/management-demo.ts
npx tsx examples/node-scripts/oauth-pkce-demo.ts
```

The runner asks only for values required by the selected operation. Put common values in `.env` to accept them as prompt defaults:

```bash
export ZORVEUS_TEST_PROVIDER="openai"
export ZORVEUS_TEST_PROVIDER_API_KEY="disposable-provider-key"
export ZORVEUS_TEST_PROVIDER_ROTATED_API_KEY="optional-second-disposable-key"
npm run demo:runner
```

Provider credential creation, rotation, and deletion are separate menu options. Deletion requires typing the credential ID again. The OAuth demo remains separate because it requires browser authorization. Set `ZORVEUS_REVOKE_OAUTH_TOKEN=true` to revoke the issued OAuth token at the end.

> [!NOTE]
> `oauth-pkce-demo.ts` passes `scopes: ["inference:write", "models:*"]`. The Zorveus OAuth consent backend requires at least one model scope (`models:*`) to grant user inference authorization.

## License

MIT © [Zorveus Inc.](https://zorveus.com)
