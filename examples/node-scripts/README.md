# Zorveus Node.js & TypeScript Automation Scripts

Standalone CLI scripts demonstrating core workflows of the `@zorveus/sdk` package in Node.js environments.

---

## 📜 Available Scripts

### 1. `inference-demo.ts`
Demonstrates basic chat completions and real-time streaming with custom spend caps:
```bash
npx tsx examples/node-scripts/inference-demo.ts
```

### 2. `management-demo.ts`
Demonstrates Control Plane operations:
- Provisioning product users via `createOrUpdate` (`PUT /product-users/by-external-id`)
- Querying live caps and balances
- Issuing promotional credit grants via `grantCredit`
- Listing the persistent credit grant ledger via `listCreditGrants`

```bash
npx tsx examples/node-scripts/management-demo.ts
```

### 3. `oauth-pkce-demo.ts`
Demonstrates full OAuth 2.0 PKCE flow in Node.js (generating code verifier, challenge, authorization URL, and code token exchange).
```bash
npx tsx examples/node-scripts/oauth-pkce-demo.ts
```
