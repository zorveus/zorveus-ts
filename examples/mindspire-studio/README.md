# MindSpire AI Studio — Consumer BYOK & OAuth Reference App

A full-featured React application showcasing **Zorveus OAuth PKCE (Connect Wallet)**, **BYOK Inference Keys**, and **Real-Time Spend Cap Indicators** using `@zorveus/react` and `@zorveus/sdk`.

---

## ✨ Features

- **OAuth PKCE Connect Wallet**:
  - Zero-friction one-click user sign-in via `ZorveusOAuth.getAuthorizationUrl({ usePkce: true })` and `exchangeToken`.
  - Secure code verifier and state management in `sessionStorage`.
  - Automatic token refreshing and session lifecycle handling.

- **Real-Time Spend Cap & Wallet Indicator**:
  - Live progress bar visualising current monthly spend versus limit.
  - Multi-tier thresholds (Normal, Warning at 80%, Critical at 95%).
  - Real-time spend event subscriptions.

- **BYOK Multi-Model Chat Studio**:
  - Streaming conversational chat completions via `@zorveus/sdk`.
  - Model catalog browser with provider routing and latency metrics.

---

## 🚀 Quickstart Setup

### 1. Configure Environment Variables
Copy the template configuration file:
```bash
cp .env.example .env
```

Edit `.env` and fill in your Zorveus OAuth client credentials:
```env
# OAuth Client ID from your Zorveus Dashboard
VITE_ZORVEUS_CLIENT_ID="zrv_client_..."

# Zorveus Control Plane Backend URL
VITE_ZORVEUS_API_URL="http://localhost:8000"

# AI Gateway URL
VITE_ZORVEUS_GATEWAY_URL="http://localhost:4000/v1"

# OAuth Callback URL
VITE_ZORVEUS_REDIRECT_URI="http://localhost:5173/oauth/callback"
```

### 2. Start the Development Server
From the repository root:
```bash
npm run demo:mindspire
```
Or directly within this directory:
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📦 React Hooks & Components Used

| Component / Hook | Source | Purpose |
| :--- | :--- | :--- |
| `<ZorveusProvider>` | `@zorveus/react` | Application-wide auth, spend, and client context provider |
| `<ConnectWalletButton>` | `@zorveus/react` | Pre-built OAuth Connect Wallet button with state management |
| `<SpendCapIndicator>` | `@zorveus/react` | Visual spend progress bar with color-coded warning thresholds |
| `useZorveusAuth()` | `@zorveus/react` | Hook for managing session tokens, connections, and logout |
| `useZorveusSpend()` | `@zorveus/react` | Hook for polling or subscribing to real-time spend balance |
| `useZorveusInference()` | `@zorveus/react` | Hook for streaming chat completions into React state |
