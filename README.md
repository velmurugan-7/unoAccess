# UnoAccess v3 — Secure SSO Platform

A production-ready Single Sign-On system with OAuth 2.0 / OIDC, performance monitoring, real-time alerts, SLO tracking, API keys, and a full light-mode SaaS UI.

---

## 🚀 Quick Start

```bash
# Backend
cd back
cp .env.example .env      # fill in your values
npm install
npm run dev               # starts on :5000

# Frontend
cd front
cp .env.example .env      # set VITE_API_URL if needed
npm install
npm run dev               # starts on :5173
```

Open http://localhost:5173 — you'll see the landing page.

---

## 🗂️ Project Structure

```
unoaccess/
├── back/                     # Node.js + Express + TypeScript + MongoDB
│   └── src/
│       ├── controllers/      # authController, userController, adminController,
│       │                     # monitoringController, apiKeyController,
│       │                     # alertController, sloController,
│       │                     # sdkEventsController, statusController
│       ├── models/           # User, OAuthClient, AccessToken, RefreshToken,
│       │                     # AuditLog, ApiKey, Alert, Slo, Incident, SdkEvents
│       ├── routes/           # auth, user, admin, oauth, monitoring, status
│       ├── services/         # webhookService, auditService, alertWorker,
│       │                     # cacheService, originService
│       └── utils/            # jwt, email, encryption, logger
└── front/                    # React + Vite + TypeScript + Tailwind (light SaaS)
    └── src/
        ├── pages/            # LandingPage, PricingPage, StatusPage, DocsPage,
        │                     # DashboardPage, SettingsPage, AdminPage,
        │                     # ApiKeysPage, AlertsPage, SloPage,
        │                     # ErrorsPage, ServiceMapPage, ...
        ├── components/       # AppShell, ui (Button, Card, Modal, Badge…)
        └── store/            # authStore (Zustand)
```

---

## ✨ What's New in v3

### Frontend Redesign
- **Light-mode SaaS aesthetic** — Cloudflare/Linear style with DM Sans font, clean cards, subtle shadows
- **Sidebar navigation** — collapsible AppShell used by all authenticated pages
- **Public pages** — Landing (`/`), Pricing (`/pricing`), Status (`/status`), Docs (`/docs`)
- **Branded error pages** — 404, 403, 500 with helpful links
- All auth pages (Login, Signup, Forgot/Reset Password) redesigned with the new system

### New Features

#### API Keys (Personal Access Tokens)
- **Page:** `/account/keys`
- **Endpoints:** `GET/POST /api/user/api-keys`, `DELETE /api/user/api-keys/:id`
- Users can create named tokens with optional expiry. Keys are shown once, stored as SHA-256 hashes.
- Authenticate any API request: `Authorization: Bearer ua_your_key`

#### Real-time Alerts
- **Page:** `/alerts`
- **Endpoints:** `GET/POST /api/user/alerts`, `PUT/DELETE /api/user/alerts/:id`, `GET /api/user/alerts/history`
- Define rules: metric (`error_rate`, `response_time_p95`, etc.) + condition + threshold + window
- Notify via email or webhook. Background worker checks every 60 seconds.

#### SLO Dashboards
- **Page:** `/app/:clientId/slo`
- **Endpoints:** `GET/POST /api/user/slo`, `DELETE /api/user/slo/:id`, `GET /api/user/slo/:clientId/report`
- Define SLOs (p95 latency, error rate, availability) with configurable windows
- Compliance chart with daily data points. Export report as JSON.

#### Error Tracking (SDK)
- **Page:** `/app/:clientId/errors`
- **Endpoint:** `POST /api/monitoring/errors` (SDK → backend), `GET /api/monitoring/:clientId/errors`
- Capture errors in your app: `monitor.captureError(error, { service: 'api', userId })`
- Grouped by fingerprint, shows frequency, affected users, stack traces. Mark as resolved.

#### Custom Events / Service Map
- **Pages:** `/app/:clientId/service-map`
- **Endpoints:** `POST /api/monitoring/events`, `GET /api/monitoring/:clientId/service-map`
- Trace custom metrics: `monitor.trace('db.query', { service: 'postgres', value: 42 })`
- SVG force-directed dependency graph built from `service` tags

#### Status Page
- **Page:** `/status` (public)
- **Endpoints:** `GET /api/status`, `POST/PUT /api/status/incidents` (admin only)
- Shows component health, active incidents with timeline updates, 7-day incident history

#### Audit Log Export
- **Endpoint:** `GET /api/user/audit-log/export?format=csv|json`
- Download full audit log as CSV or JSON directly from Settings

---

## 🧪 Testing New Features

### 1. API Keys
```
1. Sign in → Account → API Keys → Create key
2. Copy the displayed key (shown once)
3. Test: curl http://localhost:5000/api/user/profile -H "Authorization: Bearer ua_..."
```

### 2. Alert Rules
```
1. First create an OAuth client in Admin → Clients
2. Go to Alerts → New rule
3. Select your client, set metric = error_rate > 1, window = 1 min, channel = email
4. Send some requests to /api/monitoring/logs with statusCode >= 400
5. Wait ~60s for the worker to fire (check server logs)
```

### 3. SLO Reports
```
1. Monitoring page for an app → SLO tab
2. Add SLO: p95 latency ≤ 500ms, 7-day window
3. Ingest some logs via the SDK or POST /api/monitoring/logs
4. Refresh — the compliance chart populates with real data
```

### 4. Error Tracking
```javascript
// In your monitored app:
monitor.captureError(new Error('Payment failed'), {
  service: 'billing',
  userId: 'user_123',
  orderId: 'ord_456',
});
```
Then view at `/app/:clientId/errors`.

### 5. Status Page (admin)
```
1. Sign in as admin → open browser console or use curl:
   POST /api/status/incidents
   { "title": "API degraded", "impact": "minor", "affectedComponents": ["api"], "message": "Investigating slowness" }
2. Visit /status — incident appears immediately
3. PUT /api/status/incidents/:id  { "status": "resolved", "message": "Issue resolved" }
```

---

## 🔐 Environment Variables

All existing variables remain unchanged. See `back/.env.example` for the full list.

No new required variables are needed for v3 features.

---

## 🏗️ Deployment

### Backend (Render / Railway / Fly.io)
```bash
cd back && npm run build
# Set NODE_ENV=production and all env vars
node dist/server.js
```

### Frontend (Vercel / Netlify)
```bash
cd front && npm run build
# Deploy dist/ — vercel.json handles SPA routing
```

---

## 📦 Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Node.js, Express, TypeScript, Mongoose |
| Database | MongoDB Atlas |
| Auth | JWT (httpOnly cookies), bcrypt, speakeasy (2FA) |
| Frontend | React 18, Vite, TypeScript, Tailwind CSS v3 |
| Charts | Recharts |
| State | Zustand |
| Email | Nodemailer (Ethereal in dev) |
| Fonts | DM Sans, DM Mono (Google Fonts) |
