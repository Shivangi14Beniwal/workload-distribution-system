# ⚡ WorkloadDS — Lead Distribution System

A production-grade lead distribution platform that automatically assigns service requests to providers using mandatory rules, fair round-robin rotation, and real-time updates.

**Live Demo:** https://workload-distribution-system-f9sz.vercel.app  
**GitHub:** https://github.com/Shivangi14Beniwal/workload-distribution-system

---

## What is this?

When a customer submits a service request, the system automatically assigns exactly 3 providers using mandatory rules, fair rotation, and quota management. Built to demonstrate scalable backend engineering concepts.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend + Backend | Next.js 14, TypeScript |
| Database | PostgreSQL (Neon) |
| ORM | Prisma 6 |
| Validation | Zod |
| Deployment | Vercel |

---

## Allocation Algorithm

```
1. Check mandatory rules → assign fixed providers per service
2. Fill remaining slots from rotation pool → ordered by assignedCount ASC
3. Skip providers at monthly quota (10/month)
4. Always results in exactly 3 providers per lead
```

State stored in `AllocationState` table — survives server restarts and scaling.

---

## Key Engineering Concepts

**Concurrency** — PostgreSQL Advisory Locks prevent double assignment under load
```typescript
await prisma.$executeRaw`SELECT pg_advisory_lock(123456789)`;
try { /* allocation */ } finally { await prisma.$executeRaw`SELECT pg_advisory_unlock(123456789)`; }
```

**Idempotency** — Webhook fires 5 times, quota resets exactly once (same pattern as Stripe)
```
idempotencyKey: "quota-reset-2024-01-15" → processed once, cached forever
```

**DB Constraints** — Correctness guaranteed even if application code has bugs
```
@@unique([phone, serviceId])    → no duplicate leads
@@unique([leadId, providerId])  → no double assignment
@@unique([idempotencyKey])      → no duplicate webhook processing
```

---

## Project Structure

```
app/
├── api/
│   ├── leads/route.ts       # Lead creation + allocation trigger
│   ├── webhook/route.ts     # Idempotent quota reset
│   ├── dashboard/route.ts   # Provider stats
│   └── sse/route.ts         # Real-time events
├── request-service/         # Customer form
├── dashboard/               # Live provider dashboard
└── test-tools/              # Concurrency + webhook testing

lib/
├── allocation/engine.ts     # Core allocation logic
├── db.ts                    # Prisma singleton
└── validations.ts           # Zod schemas
```

---

## Local Setup

```bash
git clone https://github.com/Shivangi14Beniwal/workload-distribution-system.git
cd workload-distribution-system
npm install
# Add DATABASE_URL to .env
npx prisma migrate dev
npx tsx prisma/seed.ts
npm run dev
```

---

## Pages

| Page | URL | Purpose |
|------|-----|---------|
| Home | `/` | Overview |
| Request Service | `/request-service` | Customer form |
| Dashboard | `/dashboard` | Real-time provider view |
| Test Tools | `/test-tools` | Test concurrency + webhooks |

---

*Demonstrates: Advisory Locking, Idempotency, Persistent Round-Robin, SSE, Rate Limiting, Audit Logging*