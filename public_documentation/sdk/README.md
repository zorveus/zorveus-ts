# Zorveus SDK Architecture & Specification (Generic)

This document defines the core architecture, design principles, authentication hierarchy, and error models shared across all official Zorveus SDKs (`@zorveus/sdk` for TypeScript/JavaScript, `zorveus` for Python, `zorveus-go`, etc.).

---

## 1. Core Vision & Design Principles

All official Zorveus SDKs adhere to 5 fundamental engineering principles:

1. **Dual-Plane Architecture**:
   - **Data Plane (Inference Gateway)**: 100% drop-in compatibility with the OpenAI SDK standard routed through `https://api.zorveus.com/v1`.
   - **Control Plane (Management API)**: Typed methods for server-side management of product users, credit grants, BYOK provider credentials, wallet balances, and spending caps on `https://api.zorveus.com`.
2. **Credential-Driven Mode Resolution**:
   - An **Inference Key** (`zrv_...`) or **OAuth Access Token** (`zrv_oauth_...`) enables inference and inline attribution.
   - An **Organization Service Key** (`zrv_service_...`) enables control plane operations.
3. **Decimal Safety for Monetary Values**:
   - Money and precise balance amounts are treated strictly as **`string`** at API boundaries (e.g. `"15.0000"`). Floating-point arithmetic on monetary values inside SDK primitives is strictly forbidden.
4. **Zero Runtime Bloat & Multi-Runtime Portability**:
   - SDKs use native HTTP primitives (e.g., standard `fetch` in JS/TS, standard `urllib`/`httpx` in Python) without heavy third-party dependencies.
5. **Actionable, Typed Error Hierarchy**:
   - Explicit exception types that give developers actionable context (e.g., distinguishing between a cap violation, insufficient funds, and invalid model selection).

---

## 2. Architecture Diagram

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                Zorveus Client Instance                                 │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
               ┌────────────────────────────┴────────────────────────────┐
               ▼                                                         ▼
┌──────────────────────────────────────────────┐ ┌──────────────────────────────────────────────┐
│        1. Inference Gateway (Data Plane)     │ │        2. Management API (Control Plane)     │
│       Base URL: https://api.zorveus.com/v1   │ │          Base URL: https://api.zorveus.com   │
│       Auth: Bearer zrv_...                   │ │          Auth: Bearer zrv_service_...        │
├──────────────────────────────────────────────┤ ├──────────────────────────────────────────────┤
│ • chat.completions.create(...)               │ │ • productUsers.createOrUpdate(...)           │
│ • chat.completions.create(..., stream: true) │ │ • productUsers.grantCredit(...)              │
│ • embeddings.create(...)                     │ │ • providerCredentials.create(...)            │
│ • models.list()                              │ │ • wallet.getOverview() / getLedger()         │
│ • Inline metadata product-user attribution   │ │ • caps.list() / caps.create(...)             │
└──────────────────────────────────────────────┘ │ • usage.query(...)                           │
                                                 └──────────────────────────────────────────────┘
```

---

## 3. Data Plane: Inline Product-User Attribution

When calling inference models through the gateway, the SDK allows developers to attribute requests directly to their end-users without making separate API calls:

### Attribution Header Contract
The gateway inspects these headers (or standard OpenAI request body fields):
- `X-Zorveus-External-User-Id`: The startup's external customer ID (e.g. `"usr_ext_9941"`).
- `X-Zorveus-User-Display-Name`: Customer's display name.
- `X-Zorveus-User-Email`: Customer's email.
- `X-Zorveus-Metadata-*`: Custom key-value pairs (e.g., `X-Zorveus-Metadata-Plan: pro`).

If the external user ID has not been seen before, Zorveus creates the product user inline and applies applicable credit grants and spending caps.

---

## 4. Universal Error Hierarchy

All SDKs map HTTP and API error payloads into this standardized exception hierarchy:

```text
ZorveusError (Base Error)
├── APIConnectionError (Network failures, timeouts, DNS errors)
├── APIStatusError (Base for HTTP 4xx/5xx responses)
│   ├── AuthenticationError (HTTP 401 - Invalid or expired key/token)
│   ├── PermissionDeniedError (HTTP 403 - Model or scope not permitted)
│   ├── NotFoundError (HTTP 404 - Resource does not exist)
│   ├── UnprocessableEntityError (HTTP 422 - Schema validation failure)
│   ├── RateLimitError (HTTP 429 - Rate limit exceeded)
│   ├── InternalServerError (HTTP 500, 502, 503, 504)
│   └── ZorveusBusinessError
│       ├── InsufficientFundsError (HTTP 402 - Wallet balance exhausted)
│       ├── CapExceededError (HTTP 402/403 - Monthly/daily spending cap reached)
│       └── CreditGrantExpiredError (Product-user credit grant has expired)
```

---

## 5. Specific Language & Framework Specifications

- **TypeScript / JavaScript SDK (`@zorveus/sdk`)**: [`typescript_javascript_sdk.md`](./typescript_javascript_sdk.md)
- **Python SDK (`zorveus`)**: [`python_sdk.md`](./python_sdk.md)
- **React UI Library (`@zorveus/react`)**: [`react_sdk.md`](./react_sdk.md)
- **Go SDK (`zorveus-go`)**: [`go_sdk.md`](./go_sdk.md)

