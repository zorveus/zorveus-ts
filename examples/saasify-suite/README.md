# ResumeCraft AI — SaaSify AI Workflow Suite

A modern, production-grade B2B SaaS reference application demonstrating the **Zorveus Startup Control Plane** & **AI Gateway SDK**.

ResumeCraft AI empowers job seekers with streaming AI-generated cover letters, Google XYZ resume bullet points, and ATS match analysis, while providing startup administrators with real-time spend cap governance and promotional credit grants.

---

## ✨ Features

- **Startup Admin Control Plane**:
  - Live candidate directory with per-user spend caps and tiers (Starter, Pro, Executive).
  - **Zero-Friction User Provisioning**: Automatic upserting via `service.productUsers.createOrUpdate(...)` (`PUT /product-users/by-external-id`).
  - **Live Credit Grants Ledger**: Directly reads persistent credit grants from Zorveus (`GET /product-users/{id}/credit-grants`).
  - **Instant Credit Grants**: Issue promotional grants (`service.productUsers.grantCredit`) with quick preset chips (`+$10.00`, `+$25.00`, etc.) and decimal formatting.

- **Candidate AI Document Studio**:
  - Real-time token streaming via the Zorveus AI Gateway (`client.chat.completions.create({ stream: true })`).
  - Strict monthly allowance tracking and credit enforcement.
  - Three specialized career tools: Cover Letter Generator, Google XYZ Resume Refiner, and ATS Match Analyzer.

- **Strict Error Surfacing & Zero Fallbacks**:
  - Live backend responses strictly drive the UI — no synthetic fallbacks.
  - Detailed API error banners when the backend is unreachable or unauthorized.

---

## 🚀 Quickstart Setup

### 1. Configure Environment Variables
Copy the template configuration file:
```bash
cp .env.example .env
```

Edit `.env` and fill in your Zorveus credentials:
```env
# Zorveus App ID (From your Zorveus Dashboard)
VITE_ZORVEUS_APP_ID="your_app_id_here"

# Service Key for Control Plane Admin Access & Credit Grants
VITE_ZORVEUS_SERVICE_KEY="zrv_svc_..."

# Control Plane Backend URL
VITE_ZORVEUS_API_URL="http://localhost:8000"

# AI Gateway URL
VITE_ZORVEUS_GATEWAY_URL="http://localhost:4000/v1"
```

### 2. Start the Development Server
From the repository root:
```bash
npm run demo:saasify
```
Or directly within this directory:
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🛠️ SDK Methods Used

| SDK Method | HTTP Route | Purpose |
| :--- | :--- | :--- |
| `service.productUsers.createOrUpdate(params)` | `PUT /product-users/by-external-id` | Auto-provisions or retrieves candidate profile with live cap & credit summary |
| `service.productUsers.listCreditGrants(userId)` | `GET /product-users/{id}/credit-grants` | Queries persistent credit grants ledger from database |
| `service.productUsers.grantCredit(userId, params)` | `POST /product-users/{id}/credit-grants` | Issues startup-funded bonus credits to a candidate |
| `client.chat.completions.create(params)` | `POST /v1/chat/completions` | Streams high-speed AI inference through Zorveus Gateway |
