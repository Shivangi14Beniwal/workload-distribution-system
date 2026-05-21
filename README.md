# ⚡ WorkloadDS — Lead Distribution System

A production-grade lead distribution platform that automatically assigns service requests to providers using mandatory rules, fair round-robin rotation, and real-time updates.

**Live Demo:** https://workload-distribution-system-f9sz.vercel.app

---

## 🎯 What Problem Does This Solve?

In platforms like Sulekha, UrbanClap, or any service marketplace — when a customer submits a request, the system needs to automatically decide which providers should receive that lead. This decision must be:

- **Fair** — no single provider gets all the leads
- **Rule-based** — certain providers must always get certain leads
- **Concurrent-safe** — 100 requests at the same time should not cause double assignments
- **Quota-aware** — providers have monthly limits
- **Real-time** — providers see new leads instantly

This project solves exactly that.

---

## 🏗️ System Architecture

```
Customer Form → POST /api/leads → Allocation Engine → Database
                                        ↓
                              1. Mandatory Rules Check
                              2. Fair Round-Robin Selection
                              3. Quota Validation
                              4. Atomic DB Write
                              5. SSE Notification → Dashboard
```

---

## 🧠 Allocation Algorithm

Every lead goes through this exact sequence:

### Step 1 — Mandatory Assignment
Each service has mandatory providers stored in the `MandatoryRule` table:

| Service | Mandatory Providers |
|---------|-------------------|
| Service 1 | Provider 1 |
| Service 2 | Provider 5 |
| Service 3 | Provider 1 + Provider 4 |

These providers always receive the lead first, regardless of rotation state — as long as they have remaining quota.

### Step 2 — Fair Round-Robin (Persistent)
Remaining slots (up to 3 total) are filled from an eligible pool, ordered by `assignedCount ASC`.

The provider with the fewest total assignments gets the next lead. This state is stored in the `AllocationState` table — not in memory — so it survives server restarts, new deployments, and horizontal scaling.

| Service | Rotation Pool |
|---------|--------------|
| Service 1 | Provider 2, 3, 4 |
| Service 2 | Provider 6, 7, 8 |
| Service 3 | Provider 2, 3, 5, 6, 7, 8 |

### Step 3 — Quota Check
Every provider has `monthlyQuota = 10`. Providers at quota are skipped entirely. Quota resets via webhook with idempotency protection.

### Result
Every lead gets **exactly 3 providers** — a mix of mandatory + fair rotation assignments.

---

## 🔒 Concurrency Handling

**Problem:** If 10 requests arrive simultaneously, two transactions might read the same `assignedCount`, assign the same provider twice, and corrupt the fair rotation.

**Solution:** PostgreSQL Advisory Locks

```typescript
// Acquire lock — only ONE allocation runs at a time
await prisma.$executeRaw`SELECT pg_advisory_lock(123456789)`;

try {
  // ... allocation logic with fresh data reads
} finally {
  // ALWAYS release — even on error
  await prisma.$executeRaw`SELECT pg_advisory_unlock(123456789)`;
}
```

**Why Advisory Locks over transactions?**
- No timeout issues on serverless/cloud databases
- Explicit control over lock acquisition and release
- Same pattern used in production systems at scale
- `finally` block guarantees lock is always released

**Database-level safety nets:**
- `@@unique([leadId, providerId])` — prevents double assignment even if lock fails
- `@@unique([phone, serviceId])` — prevents duplicate lead creation at DB level

---

## 🎯 Webhook Idempotency

Payment gateways (Stripe, Razorpay) retry webhooks on failure. Without idempotency, a quota reset could fire 5 times and reset quotas 5 times.

**Solution:** Every webhook call requires a unique `idempotencyKey`:

```
First call  → processes and stores result → 200: "Quotas reset"
Same key    → returns cached result instantly → 200: "Already processed"
```

The `WebhookEvent` table has a `@@unique([idempotencyKey])` constraint — even if two identical requests hit the server simultaneously, the database ensures only one is processed.

**This is the exact same pattern Stripe uses.**

---

## 🗄️ Database Schema

```
Service          Provider
  │                │
  ├── Lead         ├── LeadAssignment ──── Lead
  ├── MandatoryRule│
  └── AllocationState

WebhookEvent (idempotency log)
AuditLog (append-only decision trail)
```

### Key Design Decisions

| Table | Constraint | Why |
|-------|-----------|-----|
| `Lead` | `@@unique([phone, serviceId])` | Duplicate prevention at DB level, not app level |
| `LeadAssignment` | `@@unique([leadId, providerId])` | Provider cannot get same lead twice |
| `AllocationState` | Persisted counter per provider/service | Round-robin survives restarts |
| `WebhookEvent` | `@@unique([idempotencyKey])` | Prevents duplicate webhook processing |
| `AuditLog` | Append-only | Full decision trail for debugging |

---

## ⚡ Real-time Dashboard

The dashboard uses **Server-Sent Events (SSE)** — a lightweight alternative to WebSockets for one-way server-to-client streaming.

```
New Lead Created
      ↓
POST /api/leads
      ↓
notifyDashboard() → pushes "update" to all SSE clients
      ↓
Dashboard receives event → re-fetches /api/dashboard
      ↓
Provider cards update in real-time
```

Falls back to polling every 5 seconds if SSE connection drops.

---

## 🛡️ Rate Limiting

Per-endpoint rate limits via Next.js middleware:

| Endpoint | Limit |
|----------|-------|
| `POST /api/leads` | 10 requests/minute per IP |
| `POST /api/webhook` | 20 requests/minute per IP |
| `GET /api/dashboard` | 60 requests/minute per IP |

Returns `429 Too Many Requests` with `Retry-After` header when exceeded.

---

## 🌍 Real-World Applications

This exact architecture is used in:

| Domain | Use Case |
|--------|---------|
| **Support Ticket Routing** | Tickets assigned to agents based on workload and specialization rules |
| **Delivery Task Assignment** | Orders distributed to delivery partners with capacity limits |
| **Sales Lead Distribution** | Leads fairly distributed across sales team with territory rules |
| **Job Scheduling** | Background tasks assigned to workers with concurrency control |
| **On-call Rotation** | Alerts routed to engineers based on rotation and escalation rules |

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes (Node.js) |
| Database | PostgreSQL (Neon serverless) |
| ORM | Prisma 6 |
| Validation | Zod |
| Deployment | Vercel |

---

## 📁 Project Structure

```
workload-distribution-system/
├── app/
│   ├── api/
│   │   ├── leads/route.ts        # Lead creation + duplicate detection
│   │   ├── webhook/route.ts      # Idempotent quota reset
│   │   ├── dashboard/route.ts    # Provider stats aggregation
│   │   ├── sse/route.ts          # Real-time event stream
│   │   └── services/route.ts     # Service listing
│   ├── request-service/page.tsx  # Customer form
│   ├── dashboard/page.tsx        # Real-time provider dashboard
│   ├── test-tools/page.tsx       # Concurrency + webhook testing
│   └── page.tsx                  # Landing page
├── lib/
│   ├── allocation/
│   │   ├── engine.ts             # Core allocation orchestrator
│   │   └── rules.ts              # Mandatory rules loader
│   ├── db.ts                     # Prisma client singleton
│   └── validations.ts            # Zod schemas + response builders
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── seed.ts                   # Seed data
└── middleware.ts                 # Rate limiting
```

---

## 🛠️ Local Setup

```bash
# Clone
git clone https://github.com/Shivangi14Beniwal/workload-distribution-system.git
cd workload-distribution-system

# Install
npm install

# Configure environment
cp .env.example .env
# Add your DATABASE_URL from neon.tech

# Setup database
npx prisma migrate dev
npx tsx prisma/seed.ts

# Run
npm run dev
```

---

## 🧪 Testing the System

### 1. Submit a Lead
Go to `/request-service`, fill the form. The system assigns exactly 3 providers instantly.

### 2. Watch Real-time Updates
Open `/dashboard` in one tab, submit a lead in another — dashboard updates without refresh.

### 3. Test Idempotency
Go to `/test-tools` → "Test Idempotency" — webhook fires 5 times, quota resets exactly once.

### 4. Test Load Handling
Go to `/test-tools` → "Generate 10 Leads" — 10 leads created, each getting 3 providers.

### 5. Reset Quotas
Go to `/test-tools` → "Reset All Quotas" — simulates monthly billing cycle reset.

---

## 📊 API Reference

### POST /api/leads
```json
Request:
{
  "name": "Shivangi Beniwal",
  "phone": "9876543210",
  "city": "Mumbai",
  "serviceId": "uuid",
  "description": "I need help with this service"
}

Response 201:
{
  "success": true,
  "data": { "leadId": "uuid", "assignedProviders": 3, "service": "Service 1" }
}

Response 409: Duplicate lead (same phone + service)
Response 400: Validation failed
```

### POST /api/webhook
```json
Request:
{
  "idempotencyKey": "quota-reset-2024-01-15",
  "eventType": "quota.reset",
  "payload": {}
}

Response 200: Quota reset or already processed
```

### GET /api/dashboard
```json
Response 200:
{
  "providers": [
    {
      "id": "uuid",
      "name": "Provider 1",
      "monthlyQuota": 10,
      "leadsThisMonth": 4,
      "remainingQuota": 6,
      "leads": [...]
    }
  ]
}
```

---

## 💡 Key Engineering Concepts Demonstrated

- **Advisory Locking** — mutual exclusion without transaction timeouts
- **Idempotency** — safe retry handling via unique key constraints
- **Persistent State** — round-robin survives restarts via DB, not memory
- **DB-level Constraints** — correctness guaranteed even if application code has bugs
- **SSE** — real-time updates without WebSocket complexity
- **Rate Limiting** — protection against API abuse
- **Audit Logging** — append-only trail for every system decision
- **Zod Validation** — type-safe input validation with detailed error messages

---

*Built as a production-grade resume project demonstrating scalable backend engineering concepts applicable to companies like Flipkart, Microsoft, and Amazon.*