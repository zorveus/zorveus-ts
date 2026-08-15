# Zorveus Node.js Standalone Automation Scripts

A collection of standalone, ready-to-run TypeScript automation scripts demonstrating `@zorveus/sdk` in Node.js backend environments.

---

## 📁 Included Scripts

1. **`basic-inference.ts`**: Non-streaming and streaming chat completions across foundation models.
2. **`user-management.ts`**: Product user provisioning (`PUT /product-users/by-external-id`), profile inspection, and credit summary.
3. **`grant-credits.ts`**: Promotional credit issuance anchored to external user ID (`POST /product-users/by-external-id/credit-grants`) and ledger inspection (`GET /product-users/by-external-id/credit-grants`).
4. **`oauth-pkce-flow.ts`**: Complete OAuth 2.0 PKCE URL generation and token exchange simulation.

---

## 🚀 Running the Scripts

### 1. Configure Environment Variables
Set your keys in your shell or `.env`:
```bash
export ZORVEUS_INFERENCE_KEY="zrv_..."
export ZORVEUS_SERVICE_KEY="zrv_svc_..."
export ZORVEUS_APP_ID="app_..."
```

### 2. Execute with `tsx`
```bash
# Test AI inference streaming
npx tsx src/basic-inference.ts

# Test product user provisioning
npx tsx src/user-management.ts

# Test issuing AI credits via external ID
npx tsx src/grant-credits.ts

# Test OAuth PKCE generator
npx tsx src/oauth-pkce-flow.ts
```

---

## 📄 License

MIT © [Zorveus Inc.](https://zorveus.com)
