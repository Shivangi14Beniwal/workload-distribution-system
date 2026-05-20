# Workload Distribution System

A production-grade lead distribution platform built with Next.js, PostgreSQL, and Prisma.

## Live Demo
[Add your deployment URL here]

## Tech Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma

## Features
- Automatic lead distribution to exactly 3 providers per lead
- Mandatory provider assignment rules
- Fair round-robin rotation
- Monthly quota management
- Real-time dashboard via SSE
- Idempotent webhook for quota reset
- Concurrency-safe allocation

## Allocation Algorithm

### Step 1 — Mandatory Assignment
Each service has mandatory providers defined in the `MandatoryRule` table:
- Service 1 → Provider 1 always receives
- Service 2 → Provider 5 always receives  
- Service 3 → Provider 1 + Provider 4 always receive

### Step 2 — Fair Rotation
Remaining slots filled from eligible pool ordered by `assignedCount ASC`.
Provider with fewest assignments gets next lead — persistent round-robin.
State stored in `AllocationState` table — survives server restarts.

### Step 3 — Quota Check
Every provider has `monthlyQuota = 10`. Providers at quota are skipped.
Reset only via webhook with idempotency key.

## Concurrency Handling
- No transactions used (Neon free tier timeout constraint)
- Allocation ordered by `assignedCount ASC` — deterministic selection
- DB-level unique constraint `@@unique([phone, serviceId])` prevents duplicate leads
- DB-level unique constraint `@@unique([leadId, providerId])` prevents double assignment

## Webhook Idempotency
- Every webhook call requires a unique `idempotencyKey`
- First call: processed and stored as PROCESSED in `WebhookEvent` table
- Subsequent calls with same key: return 200 immediately without re-processing
- Prevents duplicate quota resets even if payment gateway retries

## Database Design
- `Lead` — @@unique([phone, serviceId]) prevents duplicate requests
- `LeadAssignment` — @@unique([leadId, providerId]) prevents double assignment
- `AllocationState` — persists round-robin pointer across restarts
- `WebhookEvent` — idempotency log with unique key constraint
- `AuditLog` — append-only record of all system actions

## Setup Instructions

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up PostgreSQL database (Neon recommended)
4. Configure `.env`:

DATABASE_URL="your-postgresql-url"
WEBHOOK_SECRET="your-secret"


5. Run migrations: `npx prisma migrate dev`
6. Seed database: `npx tsx prisma/seed.ts`
7. Start development: `npm run dev`

## Pages
- `/` — Home
- `/request-service` — Customer form
- `/dashboard` — Real-time provider dashboard
- `/test-tools` — Concurrency and webhook testing

## Real-World Applications
This system maps directly to:
- **Support ticket routing** — tickets assigned to agents based on workload
- **Delivery task assignment** — orders distributed to delivery partners
- **Lead distribution** — sales leads fairly distributed to sales team
- **Job scheduling** — tasks assigned to workers with capacity limits