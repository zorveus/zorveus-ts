# `@zorveus/react` React & Next.js UI Library Specification

Official React UI library and hooks specification for **Zorveus**. Built directly on top of `@zorveus/sdk`, providing drop-in buttons, balance badges, spending progress bars, and headless hooks for web applications and OAuth integrations.

---

## 1. Package Installation & Dependencies

```bash
npm install @zorveus/react @zorveus/sdk
# or
pnpm add @zorveus/react @zorveus/sdk
```

### Peer Dependencies
- `react`: `>= 18.0.0`
- `react-dom`: `>= 18.0.0`
- `@zorveus/sdk`: `^0.1.0`

---

## 2. Setup & Provider (`<ZorveusProvider />`)

Wrap your application root with `<ZorveusProvider>`:

```tsx
// app/providers.tsx or src/App.tsx
"use client";

import { ZorveusProvider } from "@zorveus/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ZorveusProvider
      clientId="zrv_client_123"
      redirectUri="https://myapp.com/api/oauth/callback"
      // Optional gateway credentials:
      inferenceKey={process.env.NEXT_PUBLIC_ZORVEUS_INFERENCE_KEY}
    >
      {children}
    </ZorveusProvider>
  );
}
```

---

## 3. Drop-in UI Components

### A. `<ConnectWalletButton />`
Triggers the Zorveus OAuth PKCE consent flow in a popup or top-level redirect:

```tsx
import { ConnectWalletButton } from "@zorveus/react";

export function LoginHeader() {
  return (
    <ConnectWalletButton
      variant="default" // "default" | "outline" | "secondary"
      size="md"        // "sm" | "md" | "lg"
      scopes={["inference:read", "inference:write"]}
      onSuccess={({ accessToken, fundingOrgId }) => {
        console.log("Connected to Zorveus Org:", fundingOrgId);
      }}
      onError={(err) => {
        console.error("Connection failed:", err.message);
      }}
    >
      Connect AI Wallet
    </ConnectWalletButton>
  );
}
```

### B. `<ZorveusWalletBadge />`
Displays the connected user's or startup's live available balance with formatted currency and auto-refresh:

```tsx
import { ZorveusWalletBadge } from "@zorveus/react";

export function UserNav() {
  return (
    <div className="flex items-center gap-3">
      <ZorveusWalletBadge
        showTopUpButton={true}
        refreshInterval={30000} // Refresh balance every 30s
      />
    </div>
  );
}
```

### C. `<SpendCapIndicator />`
Visual progress bar rendering current spend versus hard monthly spending cap:

```tsx
import { SpendCapIndicator } from "@zorveus/react";

export function UsageCard() {
  return (
    <SpendCapIndicator
      current="34.50"
      limit="50.00"
      period="monthly"
      currency="USD"
      warningThreshold={0.8} // Highlight in orange at 80%
    />
  );
}
```

---

## 4. Custom React Hooks

### A. `useZorveusWallet()`
Access live wallet balances, currency, and top-up redirects:

```tsx
import { useZorveusWallet } from "@zorveus/react";

export function WalletWidget() {
  const { balance, reserved, currency, isLoading, error, refresh, openTopUpModal } = useZorveusWallet();

  if (isLoading) return <div>Loading balance...</div>;
  if (error) return <div>Error loading wallet</div>;

  return (
    <div>
      <p>Available: {balance} {currency}</p>
      <p>Reserved: {reserved} {currency}</p>
      <button onClick={openTopUpModal}>Add Funds</button>
    </div>
  );
}
```

### B. `useZorveusAuth()`
Manage connected OAuth sessions and token lifecycle:

```tsx
import { useZorveusAuth } from "@zorveus/react";

export function AccountProfile() {
  const { isConnected, fundingOrg, disconnect, connect } = useZorveusAuth();

  return (
    <div>
      {isConnected ? (
        <>
          <p>Connected Org: {fundingOrg.name}</p>
          <button onClick={disconnect}>Disconnect</button>
        </>
      ) : (
        <button onClick={() => connect()}>Connect Zorveus</button>
      )}
    </div>
  );
}
```

### C. `useZorveusInference()` (Streaming Hook)
Stream AI responses directly in React with zero boilerplate:

```tsx
import { useZorveusInference } from "@zorveus/react";

export function AIChatBox() {
  const { messages, input, setInput, submitPrompt, isStreaming } = useZorveusInference({
    model: "openai/gpt-4o",
  });

  return (
    <div>
      <div className="messages">
        {messages.map((m, i) => (
          <div key={i} className={m.role}>{m.content}</div>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); submitPrompt(); }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} disabled={isStreaming} />
        <button type="submit" disabled={isStreaming}>Send</button>
      </form>
    </div>
  );
}
```
