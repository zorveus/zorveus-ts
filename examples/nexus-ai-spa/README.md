# Nexus AI - Client-Only PKCE Single Page App

A modern, full-featured React Single Page Application (SPA) built with `@zorveus/react` and `@zorveus/sdk` demonstrating secure authentication with **only a `clientId`** and zero backend code.

## Key Features Demonstrated

1. **Zero Client Secret / Zero Backend**:
   - Authenticates directly against the Zorveus OAuth Server using standard RFC 7636 PKCE (`code_verifier` and `code_challenge`).
   - Does not require a custom backend token exchange route (`/api/oauth/exchange`).
   - Never exposes a `clientSecret` in client-side `.env` files.

2. **Popup and SPA Redirect Modes**:
   - Supports both standard popup authorization window mode and full-page redirect mode.
   - `<OAuthCallbackHandler redirectTo="/" />` completes the PKCE exchange in-browser automatically on redirect return.

3. **First-Class Media Operations**:
   - Text generation with streaming via `useZorveusInference`.
   - Direct image synthesis via `client.images.generate({ model, prompt })`.
   - Direct audio voice synthesis via `client.audio.speech({ model, voice, input })`.
   - Live budget allowance and spend cap tracking via `<SpendCapIndicator />`.

## Getting Started

### 1. Configure Environment

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Ensure `VITE_ZORVEUS_CLIENT_ID` points to your Zorveus public client ID.

### 2. Run Locally

From the repository root:
```bash
npm run demo:nexus
```
Or inside this directory:
```bash
npm run dev
```

Visit [http://localhost:5175](http://localhost:5175).
