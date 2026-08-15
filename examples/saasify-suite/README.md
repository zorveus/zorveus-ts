# ResumeCraft AI — SaaSify AI Workflow Suite

A modern, production-grade B2B SaaS reference application demonstrating the **Zorveus Startup Control Plane** & **AI Gateway SDK**.

ResumeCraft AI empowers candidates with real-time AI career tools (Cover Letter Generator, Google XYZ Bullet Refiner, ATS Match Analyzer) while providing startup administrators with spend cap governance, promotional credit grants, and live user tracking.

---

## ✨ Key Features

- **Startup Admin Control Plane**:
  - Live candidate directory with per-tier inference keys (Starter, Pro, Executive).
  - **Zero-Friction User Provisioning**: Automatic upserting via `service.productUsers.createOrUpdate(...)` (`PUT /product-users/by-external-id`).
  - **External User ID Credit Ledger**: Directly reads persistent credit grants using the candidate's external ID (`service.productUsers.listCreditGrantsByExternalId`).
  - **Instant Promotional Grants**: Issues promotional grants (`service.productUsers.grantCreditByExternalId`) with quick preset chips (`+$10.00`, `+$25.00`, etc.) and valid enum sources (`promotion`, `admin_adjustment`, etc.).

- **Candidate AI Document Studio**:
  - **Strict Live Model Discovery**: Dynamically queries `client.models.list({ routeStatus: "available" })` using the active candidate's real tier key.
  - **Real-Time Token Streaming**: Streams generated output directly through the Zorveus AI Gateway (`client.chat.completions.create({ stream: true })`) with `zorveusMetadata` candidate attribution.
  - **Zero Synthetic Fallbacks**: Every model and metric reflects live gateway state. Any API rejection or network error surfaces immediately in an explicit alert box.

---

## 🚀 Quickstart Setup

### 1. Configure Environment Variables

Create `.env` based on `.env.example`:
```bash
cp .env.example .env
```

Fill in your Zorveus credentials in `.env`:
```env
# Zorveus App ID
VITE_ZORVEUS_APP_ID="app_0897479c41944294b5b5279214b6975b"

# Service Key for Control Plane Admin Access & Credit Grants
VITE_ZORVEUS_SERVICE_KEY="zrv_svc_..."

# Control Plane Backend URL
VITE_ZORVEUS_API_URL="http://localhost:8000"

# AI Gateway URL
VITE_ZORVEUS_GATEWAY_URL="http://localhost:4000/v1"

# Tier Inference Keys
VITE_ZORVEUS_FREE_KEY="zrv_..."
VITE_ZORVEUS_PRO_KEY="zrv_..."
VITE_ZORVEUS_ENTERPRISE_KEY="zrv_..."
```

### 2. Start the Development Server

From the monorepo root:
```bash
npm run demo:saasify
```

Or from this directory:
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🛠️ SDK Methods Used

| SDK Method | HTTP Route | Purpose |
| :--- | :--- | :--- |
| `service.productUsers.createOrUpdate(params)` | `PUT /product-users/by-external-id` | Auto-provisions or retrieves candidate profile with live credit summary |
| `service.productUsers.listCreditGrantsByExternalId(params)` | `GET /product-users/by-external-id/credit-grants` | Queries persistent credit grants ledger for candidate's external ID |
| `service.productUsers.grantCreditByExternalId(params)` | `POST /product-users/by-external-id/credit-grants` | Issues promotional AI credits anchored to candidate's external ID |
| `client.models.list(params)` | `GET /v1/models?route_status=available` | Queries live accessible foundation models for active candidate key |
| `client.chat.completions.create(params)` | `POST /v1/chat/completions` | Streams AI completions with `zorveusMetadata` user attribution |

---

## 📄 License

MIT © [Zorveus Inc.](https://zorveus.com)
