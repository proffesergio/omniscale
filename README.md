# OmniScale — performance marketing, engineered as software

> Research-led growth for high-ticket brands: know your numbers, audit your funnel,
> book a strategist, and pay by mobile banking — all on one site, no third-party
> scheduling or payment widgets required.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8) ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3fcf8e) ![CI](https://img.shields.io/badge/CI-lint_typecheck_test_build-green) ![Status](https://img.shields.io/badge/MVP-code--complete_staging--in--progress-orange)

Built in Bangladesh, for growth everywhere. OmniScale is a performance-marketing and
creative-operations agency site where **every public feature is a working tool**, not a
brochure: business owners can model their funnel economics, request a growth audit, book
a discovery call, and pay for an engagement without leaving the site.

---

## What business owners can do here

### 1. Model your funnel economics — `/calculator`

An interactive ROI calculator that connects ad spend to business outcomes: CAC, gross-profit
LTV, ROAS, and MER from your AOV, spend, conversion rate, and hook rate, with expandable
assumptions (CPM, CTR, new-customer share, margin, lift scenarios) and a hypothetical
efficiency-gap readout.

- Runs **entirely in your browser** — inputs never leave the device.
- Every formula is disclosed on the page; results are **modeled estimates, never guarantees**.
- Currency-aware (USD/EUR/BDT): your manual choice wins, with location/timezone suggestion
  as fallback. Switching currency starts a new example — it never pretends to convert money.

### 2. Request a growth audit — `/audit`

A three-step guided wizard (website → competitors/channels → contact) with inline
validation. Submissions are stored durably with idempotency (retries can't duplicate),
rate-limited against abuse, and queued for the team with at-least-once delivery.
If the backend isn't configured yet, the page says so instead of faking success.

### 3. Book a discovery call — `/booking`

First-party scheduling — no Calendly embed, no account needed:

- Real 30-minute slots published by the team (2 hours to 90 days out), stored in UTC and
  shown in **your** timezone, which you can change.
- Overlapping slots are rejected by the database; double-booking is blocked by a partial
  unique index plus transactional locking.
- Confirmation screen includes an **`.ics` calendar download** and a **private management
  link** (token in the URL fragment, only its hash stored) to view or cancel.
- Meeting details are shared by the team afterwards — the site never invents video links
  or pretends to sync with your calendar.

### 4. See engagement models and pay by mobile banking — `/pricing`

Clear scopes (audit, sprint, retainer) with starting rates, then pay the way Bangladesh
actually pays: **bKash, Nagad, Rocket, bank transfer** via personal receiving accounts and
QR codes managed by the team. You pay in your own app, submit the transaction ID, and the
team verifies it by hand — usually within one business day. No gateway fees, no forced
accounts, no card required.

### 5. Browse the creative lab — `/case-studies`

Filterable creative concepts (E-commerce / B2B SaaS) with test targets and hypotheses.
Radically honest by design: everything is labeled **illustrative concept work** — no
fabricated clients, no rented testimonials, no “verified ROI” badges. Real proof only
ships with a source URL and approval date.

---

## Why teams trust this stack

| Concern | How it's handled |
|---|---|
| Honest numbers | Calculator shows its formulas; modeled vs. observed is always distinguished |
| Honest proof | Blueprints labeled illustrative; testimonials require evidence to publish |
| Your data | Server-only secrets, schema validation, honeypot, rate limits, RLS; privacy notice describes actual behavior |
| Reliability | Booking + notification saved in one DB transaction; outbox retries with backoff (8 attempts); records stay authoritative if email fails |
| No lock-in | Owned booking, owned payments, owned admin — no Calendly, no payment gateway dependency |

---

## For developers

**Stack:** Next.js 16 App Router · strict TypeScript · Tailwind CSS 4 (CSS-first, no config file) · Supabase/PostgreSQL · React Hook Form + Zod · npm workspace (`apps/web`).

```bash
git clone <this-repo> && cd omniscale
rtk proxy npm install   # plain `npm install` works where no proxy is needed
rtk proxy npm run dev   # serves http://localhost:3000 (also 127.0.0.1:3000)
```

The marketing site and calculator work with zero credentials. Audit, booking, payments, and
admin fail closed until Supabase is configured.

```bash
rtk proxy npm run lint
rtk proxy npm run typecheck
npm test            # 49 unit + embedded-PostgreSQL (PGlite) tests
npm run build       # required before e2e
npm run test:e2e    # Playwright, desktop + mobile Chrome, prod build
```

Pushes to `main` run `lint → typecheck → test → build` in GitHub Actions, then Vercel
auto-deploys (Root Directory `apps/web`). Browser tests stay local (Chrome + prod build).
Full launch runbook: [`docs/DEPLOY.md`](docs/DEPLOY.md). Pending work: [`docs/project-memory/BACKLOG.md`](docs/project-memory/BACKLOG.md).

### Connect Supabase

1. Create a Supabase project. Apply every file in `supabase/migrations/` in filename order once using the SQL editor or your migration tooling. It creates lead records, availability, bookings, payment methods, an admin allowlist, shared rate limits, and a notification outbox with RLS enabled.
2. Copy `apps/web/.env.example` to `apps/web/.env.local` and populate `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and server-only `SUPABASE_SECRET_KEY`. A legacy service-role key can be used as the server key if required by an older project. Never prefix the server key with `NEXT_PUBLIC_`.
3. Set a separate random `RATE_LIMIT_SECRET` of at least 32 characters. Use `openssl rand -hex 32`. Keep it stable: booking management links are derived from it. Rotating it invalidates regeneration of existing links and requires a planned migration.
4. Set `NEXT_PUBLIC_SITE_URL` to the exact browser origin, including scheme and port. Local development accepts localhost and 127.0.0.1 on port 3000. Production requires the configured origin. Use HTTPS on the public deployment.
5. Set `ADMIN_TOKEN` to a random string of at least 32 characters (`openssl rand -hex 32`).
   Open `/admin` and sign in with that token. It creates a 12-hour sealed session cookie;
   rotating the token signs everyone out. (The `public.admins` allowlist from the migration
   is unused while token auth is active — no Supabase Auth users are needed.)

6. Publish 30-minute slots in your browser’s local timezone. Only slots between two hours and 90 days ahead are bookable. Times are stored in UTC; visitors see their own timezone and can change it.

The server revalidates the sealed admin session before every mutation. Public users cannot directly read leads, bookings, tokens, slots, notification payloads, or rate-limit records. Admins can view the pipeline, publish/close availability, cancel bookings, reschedule to an existing slot, verify payments, and mark completed calls after their end time. Closing a slot does not cancel a reservation. There is no public signup or account-administration UI.

### Test the admin panel locally

A free Supabase project works for localhost:

1. In its SQL editor, apply every file in `supabase/migrations/` in filename order.
2. Fill `apps/web/.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `RATE_LIMIT_SECRET`, `ADMIN_TOKEN`, `NEXT_PUBLIC_SITE_URL=http://localhost:3000`).
3. Restart dev, open `/admin`, sign in with the token — no email or Supabase user needed.
4. Publish a slot 2+ hours ahead; in a private window book it at `/booking`, then cancel via the private management link. Back in `/admin`, try close/reopen, reschedule, and the payment verification queue. Emails only send once Resend/`CONTACT_EMAIL` are set; records and the outbox queue still work without them.
5. Sign out and confirm `/admin` asks for the token again. Wrong tokens are rejected without hints and repeated guesses are rate-limited.

Browser tests use `/usr/bin/google-chrome`; override `CHROME_PATH` if necessary. They launch the production server, run desktop/mobile coverage, and stop their server afterwards. The booking confirmation browser test explicitly mocks the API; database behavior is tested separately with embedded PostgreSQL. Provider delivery still needs a staging smoke test with your credentials.

### Booking internals

- One team calendar, fixed 30-minute appointments. No payment required to book.
- Database exclusion constraints reject overlapping availability; a partial unique index and transactional locking prevent double-booking.
- Idempotent request IDs prevent duplicate records after network retries. Changed payloads under the same ID are rejected.
- Availability lists the next 200 upcoming slots by default and pages forward with `GET /api/availability?after=<starts_at>&limit=<1–200>`. Admin views page 50 records at a time with keyset cursors (`sAfter`/`bAfter`/`aAfter`/`pAfter`); never treat one page as a complete archive.

### Manual payments internals

- No gateway integration and no automatic charge capture. The team manages methods from the admin panel: label, account name/number, payer instructions, visibility, and sort order.
- QR artwork must be committed under `apps/web/public/qr/` and referenced as `/qr/….png` (content security only allows same-origin and data-URI images), or pasted as a `data:image/…;base64,…` URI. Account numbers are shown to payers by design.
- `POST /api/payments` validates, rate-limits, and records TrxIDs idempotently via `submit_manual_payment`, which also queues a `payment` notification. The worker emails the TrxID to `CONTACT_EMAIL` via Resend; without those vars the notice retries. Decisions (`pending → verified/rejected`) are final; duplicate TrxIDs per method are rejected.
- Engagement prices live in `src/lib/pricing.ts` — confirm them before launch. No result is ever guaranteed; payment alone establishes no ROI.

### Notifications and audit webhooks

Saving a lead, booking, or payment and inserting its notification happen in one database transaction. Notifications are delivered by an authenticated worker endpoint, not by a browser request.

Set `CRON_SECRET` to a separate random string of at least 32 characters. Schedule a POST to `/api/internal/notifications` every minute with `Authorization: Bearer <CRON_SECRET>` using a scheduler with secure header storage. Do not place this secret in a public URL. The endpoint claims batches with `SKIP LOCKED` and a lease, retries with backoff, and stops after eight attempts. The admin dashboard displays queue counts. Delivery is at least once; generic receivers should deduplicate `X-OmniScale-Event-Id`.

Audit notifications support:

- `AUDIT_WEBHOOK_PROVIDER=generic`: set an HTTPS `AUDIT_WEBHOOK_URL` and `AUDIT_WEBHOOK_SECRET`. Verify the HMAC-SHA256 signature over `<timestamp>.<raw JSON body>` against `X-OmniScale-Signature`, reject stale timestamps, and deduplicate the event ID. Payload contains `event`, `eventId`, and `data`.
- `slack`: use a Slack incoming webhook URL. The adapter sends plain text and disables link expansion.
- `discord`: use a Discord incoming webhook URL. Mentions are disabled.

For booking confirmation/update emails and payment-verification notices, set `RESEND_API_KEY`, `BOOKING_FROM_EMAIL` (verified sender), and `CONTACT_EMAIL` (team inbox for payment notices). Configure provider retention and access appropriately. No notifications have been sent as part of local development.

If delivery credentials were missing and all retries were exhausted, fix configuration, then reset only the failed messages you intend to resend:

```sql
update public.outbox
set attempts = 0, available_at = now(), last_error = null
where delivered_at is null and attempts >= 8;
```

Monitor the queue and provider delivery logs. Booking records remain authoritative even when notification delivery fails. A scheduled request timeout after a successful webhook may cause a retry; Slack and Discord may display a duplicate notification.

### Calculator model

The four headline inputs are AOV, monthly ad spend, conversion rate, and hook rate. Expand assumptions for CPM, CTR, new customer share, lifetime order frequency, gross margin, total business revenue, total marketing spend, and relative improvements.

- Impressions = ad spend / CPM × 1,000.
- Clicks = impressions × CTR; orders = clicks × conversion rate.
- Ad-only CAC = ad spend / (orders × new customer share).
- Gross-profit LTV = AOV × lifetime orders/customer × gross margin.
- ROAS = attributed order revenue / ad spend.
- MER = total business revenue / total marketing spend.
- Scenario CTR scales proportionally with hook-rate improvement. Conversion lift is separately adjustable. Rates are capped at 100%, with fixed spend and CPM.
- Equivalent spend gap is hypothetical efficiency headroom, not measured wasted spend.

The formula disclosure on `/calculator` details assumptions and exclusions. Inputs never leave the browser. No numeric results are represented as guarantees or verified client evidence.

### Currency and location

Preference order: manually saved USD/EUR/BDT selection → trusted Vercel country header → browser timezone suggestion → USD. Other hosts use the timezone fallback unless a trusted regional adapter is added. No geolocation permission, third-party IP lookup, or precise tracking is required. Manual choice is saved in local storage. Switching currency starts a new illustrative calculator example; it does **not** perform FX conversion. Historic case-study metrics are percentages and are not relabeled as converted revenue.

### Trust and evidence

`src/lib/blueprints.ts` contains original illustrative concepts with test targets. No fabricated clients, testimonials, or verified ROI badges are shown. The typed testimonial collection supports E-commerce and B2B SaaS filtering once approved material with a source URL and approval date is supplied.

An optional internal Stripe evidence endpoint (`POST /api/internal/stripe-proof`, same bearer authentication as the worker) verifies explicitly approved live charge IDs from `STRIPE_PROOF_CHARGE_IDS` using `STRIPE_SECRET_KEY`. It returns collected amounts less recorded refunds, grouped by currency in Stripe minor units. It never publishes financial information automatically. Payment evidence alone does not establish advertising attribution, profit, or ROI; public case studies require a separate approved evidence package. See [Stripe’s charge retrieval API](https://docs.stripe.com/api/charges/retrieve).

### Production checklist

Deploy the standard Next.js app on a Node-compatible host (or Vercel with Root Directory `apps/web`). From this npm-workspace root, build with `npm run build` and start with `npm run start`. The selected Next.js runtime is retained; this repository does not substitute a different framework for hosting.

Before accepting real visitors:

1. Apply all database migrations; configure secrets, origin, `CONTACT_EMAIL`, and a backup policy.
2. Configure the scheduler and any notification providers. Test real lead persistence, booking, cancellation, rescheduling, payment verification, and email/webhook delivery against staging.
3. Publish initial slots. Verify admin token login, logout, session expiry, and rejection of wrong tokens.
4. Set a documented data-retention policy and privacy contact. The included privacy notice describes actual implemented behavior; no automatic deletion policy is enabled.
5. If your hosting proxy guarantees an overwritten client-IP header, set `TRUSTED_IP_HEADER` to that header. Otherwise leave it empty. Email and global database limits still apply. Add host-level bot/rate controls appropriate to campaign volume.
6. Replace localhost metadata with the public origin and verify canonical social images, sitemap, and robots output. Admin and management pages are marked noindex.
7. Run lint, TypeScript, unit/database tests, production build, and browser tests. Add real cross-browser testing if Safari/Firefox support is commercially critical.

The app uses CSP, origin validation, bounded JSON bodies, schema validation, a honeypot, shared database limits, server-only secrets, authorization checks, and RLS. These controls do not substitute for a deployment review and monitoring. Production dependencies currently pass the npm advisory check; development lint tooling has a transitive `braces` advisory with no compatible upstream fix. Do not apply `npm audit fix --force`, which proposes downgrading the Next lint configuration across major versions.

### Directory layout

```text
apps/web/
  src/app/                 Pages, API endpoints, admin server actions
  src/components/          Marketing, shared UI, booking, and admin components
  src/hooks/               Currency preference and browser timezone
  src/lib/                 Economics, validation, database, security, delivery
  src/types/               Domain types
  src/styles/              Responsive theme and Tailwind 4 entrypoint
  tests/                   Financial, security, PostgreSQL, browser tests
supabase/migrations/       Versioned database schema and transactional functions
```

Tailwind 4 uses CSS-first configuration (`@theme` in `globals.css`) rather than an unused `tailwind.config.ts`. Fonts are bundled locally. Product concept artwork is CSS/SVG-native and does not depend on stock image licenses or external image hosts.

Implementation references: [Next.js App Router](https://nextjs.org/docs/app/getting-started/installation), [Supabase SSR clients](https://supabase.com/docs/guides/auth/server-side/creating-a-client), and [Supabase API key handling](https://supabase.com/docs/guides/getting-started/api-keys).
