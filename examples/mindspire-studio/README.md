# MindSpire AI Studio — User AI Wallet & OAuth PKCE Demo

A modern React & Vite reference application demonstrating the **`@zorveus/react`** SDK with **OAuth 2.0 PKCE 1-click user AI wallet connection**.

Users connect their personal Zorveus AI wallet, configure foundation models, monitor their spend caps in real-time, and run streaming inference without the SaaS platform incurring model costs.

---

## ✨ Features

- **1-Click AI Wallet Connect**: Seamless Google-style sign-in button (`<ConnectWalletButton />`) with PKCE popup workflow and persistent session storage.
- **Visual Spend Cap Indicator**: Live progress bar (`<SpendCapIndicator />`) showing current spend against user-defined monthly allowances.
- **Dynamic Model Selection**: Live model dropdown populated via `useZorveusModels({ routeStatus: "available" })`.
- **Multi-Persona Streaming Assistant**: Interactive workspace with prompt streaming, markdown rendering, and token counters.

---

## 🚀 Quickstart Setup

### 1. Configure Environment Variables

Create `.env` from template:
```bash
cp .env.example .env
```

Edit `.env`:
```env
# OAuth 2.0 Client ID (from Zorveus Developer Console)
VITE_ZORVEUS_CLIENT_ID="zrv_client_92294673f5284df3899b7eaaf43ecd82"

# OAuth Callback URL
VITE_ZORVEUS_REDIRECT_URI="http://localhost:5173/oauth/callback"

# Zorveus API Endpoints
VITE_ZORVEUS_API_URL="http://localhost:8000"
VITE_ZORVEUS_GATEWAY_URL="http://localhost:4000/v1"
```

### 2. Start the Development Server

From the monorepo root:
```bash
npm run demo:mindspire
```

Or from this directory:
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧩 React SDK Hooks & Components Used

| Component / Hook | Purpose |
| :--- | :--- |
| `<ZorveusProvider>` | Context root managing OAuth PKCE tokens and Zorveus client lifecycle |
| `<OAuthCallbackHandler>` | Invisible receiver for OAuth redirect events |
| `<ConnectWalletButton>` | Styled AI Wallet connect/disconnect button |
| `<SpendCapIndicator>` | Spending cap progress bar with status thresholds |
| `useZorveusAuth()` | Accesses connection state, access token, and disconnect action |
| `useZorveusInference()` | Manages streaming prompt submission, token accumulation, and history |
| `useZorveusModels()` | Queries accessible foundation models for active connection |
| `useZorveusSpend()` | Queries live period spend and spend caps (`GET /inference-keys/usage`) |

---

## 📄 License

MIT © [Zorveus Inc.](https://zorveus.com)
