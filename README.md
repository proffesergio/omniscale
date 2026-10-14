# OmniScale

A Next.js App Router website for a performance marketing and creative operations agency. TypeScript, Tailwind CSS 4, Supabase/PostgreSQL, React Hook Form, Zod, and an owned booking/admin system. Calendly was replaced with first-party scheduling at the founder’s request.

## Run locally

Requires Node.js 22 or newer.

```bash
cd /home/billsbro/Music/codex-projects/omniscale
rtk proxy npm install
rtk proxy npm run dev
```

Open http://localhost:3000. The marketing site and calculator work without credentials. Audit submission, booking, and admin access deliberately remain unavailable until the database is configured; the app never pretends a submission was saved.

```bash
rtk proxy npm run lint
rtk proxy npm run typecheck
rtk proxy npm test
rtk proxy npm run build
rtk proxy npm run test:e2e
```

Browser tests use `/usr/bin/google-chrome`; override `CHROME_PATH` if necessary. They launch the production server, run desktop/mobile coverage, and stop their server afterwards. The booking confirmation browser test explicitly mocks the API; database behavior is tested separately with embedded PostgreSQL. Live Supabase authentication and provider delivery still need a staging smoke test with your credentials.

## Connect Supabase

1. Create a Supabase project. Apply `supabase/migrations/001_omniscale.sql` once using the SQL editor or your migration tooling. It creates lead records, availability, bookings, an admin allowlist, shared rate limits, and a notification outbox with RLS enabled.
2. Copy `apps/web/.env.example` to `apps/web/.env.local` and populate `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and server-only `SUPABASE_SECRET_KEY`. A legacy service-role key can be used as the server key if required by an older project. Never prefix the server key with `NEXT_PUBLIC_`.
3. Set a separate random `RATE_LIMIT_SECRET` of at least 32 characters. Use `openssl rand -hex 32`. Keep it stable: booking management links are derived from it. Rotating it invalidates regeneration of existing links and requires a planned migration.
4. Set `NEXT_PUBLIC_SITE_URL` to the exact browser origin, including scheme and port. Local development accepts localhost and 127.0.0.1 on port 3000. Production requires the configured origin. Use HTTPS on the public deployment.
5. In Supabase Authentication, create a team user with a strong password. Disable public signups in Auth settings. Add that user’s UUID to the allowlist:

```sql
insert into public.admins (user_id)
values ('YOUR_AUTH_USER_UUID');
```

6. Visit `/admin` and sign in. Publish 30-minute slots in your browser’s local timezone. Only slots between two hours and 90 days ahead are bookable. Times are stored in UTC; visitors see their own timezone and can change it.

The server revalidates the authenticated user and admin membership before every mutation. Public users cannot directly read leads, bookings, tokens, slots, notification payloads, or rate-limit records. Admins can view the pipeline, publish/close availability, cancel bookings, reschedule to an existing slot, and mark completed calls after their end time. Closing a slot does not cancel a reservation. Team accounts are provisioned in Supabase; this application has no public signup or account-administration UI.

## Booking behavior

- One team calendar with fixed 30-minute appointments. No payment required.
- Database exclusion constraints reject overlapping availability; a partial unique index and transactional locking prevent double-booking.
- Idempotent request IDs prevent duplicate records after network retries. Changed payloads under the same ID are rejected.
- The confirmation screen provides an `.ics` calendar download and a private management link. The token is kept in the URL fragment, not the query string, and only its hash is stored in the database.
- Visitors can view/cancel through the private link and book another slot. Admins can reschedule directly.
- No automatic video meeting creation or external Google/Outlook calendar conflict detection is included. The team supplies meeting details separately and should publish only genuinely available slots.
- Availability lists the next 200 upcoming slots by default and pages forward with `GET /api/availability?after=<starts_at>&limit=<1–200>`. Admin views page 50 records at a time with keyset cursors (`sAfter`, `bAfter`, `aAfter`); use “Show more” links rather than treating one page as a complete archive.

## Notifications and audit webhooks

Saving a lead or booking and inserting its notification happen in one database transaction. Notifications are delivered by an authenticated worker endpoint, not by a browser request.

Set `CRON_SECRET` to a separate random string of at least 32 characters. Schedule a POST to `/api/internal/notifications` every minute with `Authorization: Bearer <CRON_SECRET>` using a scheduler with secure header storage. Do not place this secret in a public URL. The endpoint claims batches with `SKIP LOCKED` and a lease, retries with backoff, and stops after eight attempts. The admin dashboard displays queue counts. Delivery is at least once; generic receivers should deduplicate `X-OmniScale-Event-Id`.

Audit notifications support:

- `AUDIT_WEBHOOK_PROVIDER=generic`: set an HTTPS `AUDIT_WEBHOOK_URL` and `AUDIT_WEBHOOK_SECRET`. Verify the HMAC-SHA256 signature over `<timestamp>.<raw JSON body>` against `X-OmniScale-Signature`, reject stale timestamps, and deduplicate the event ID. Payload contains `event`, `eventId`, and `data`.
- `slack`: use a Slack incoming webhook URL. The adapter sends plain text and disables link expansion.
- `discord`: use a Discord incoming webhook URL. Mentions are disabled.

For booking confirmation/update emails, set `RESEND_API_KEY` and `BOOKING_FROM_EMAIL` with a verified sender. Messages include appointment time, status, and the private management link. Configure provider retention and access appropriately. No notifications have been sent as part of local development.

If delivery credentials were missing and all retries were exhausted, fix configuration, then reset only the failed messages you intend to resend:

```sql
update public.outbox
set attempts = 0, available_at = now(), last_error = null
where delivered_at is null and attempts >= 8;
```

Monitor the queue and provider delivery logs. Booking records remain authoritative even when notification delivery fails. A scheduled request timeout after a successful webhook may cause a retry; Slack and Discord may display a duplicate notification.

## Calculator model

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

## Currency and location

Preference order: manually saved USD/EUR/BDT selection → trusted Vercel country header → browser timezone suggestion → USD. Other hosts use the timezone fallback unless a trusted regional adapter is added. No geolocation permission, third-party IP lookup, or precise tracking is required. Manual choice is saved in local storage. Switching currency starts a new illustrative calculator example; it does **not** perform FX conversion. Historic case-study metrics are percentages and are not relabeled as converted revenue.

## Portfolio and trust

`src/lib/blueprints.ts` contains original illustrative concepts with test targets. No fabricated clients, testimonials, or verified ROI badges are shown. The typed testimonial collection supports E-commerce and B2B SaaS filtering once approved material with a source URL and approval date is supplied.

An optional internal Stripe evidence endpoint (`POST /api/internal/stripe-proof`, same bearer authentication as the worker) verifies explicitly approved live charge IDs from `STRIPE_PROOF_CHARGE_IDS` using `STRIPE_SECRET_KEY`. It returns collected amounts less recorded refunds, grouped by currency in Stripe minor units. It never publishes financial information automatically. Payment evidence alone does not establish advertising attribution, profit, or ROI; public case studies require a separate approved evidence package. See [Stripe’s charge retrieval API](https://docs.stripe.com/api/charges/retrieve).

## Production configuration and checks

Deploy the standard Next.js app on a Node-compatible host. From this npm-workspace root, build with `npm run build` and start with `npm run start`. For a remote server, set an externally reachable listen hostname through the host’s launch command rather than the local-only default. The selected Next.js runtime is retained; this repository does not substitute a different framework for hosting.

Before accepting real visitors:

1. Apply the database migration; configure secrets, origin, `CONTACT_EMAIL`, admin users, and a backup policy.
2. Configure the scheduler and any notification providers. Test real lead persistence, booking, cancellation, rescheduling, and email/webhook delivery against staging.
3. Publish initial slots. Verify admin login, logout, expired sessions, and denial for non-admin users.
4. Set a documented data-retention policy and privacy contact. The included privacy notice describes actual implemented behavior; no automatic deletion policy is enabled.
5. If your hosting proxy guarantees an overwritten client-IP header, set `TRUSTED_IP_HEADER` to that header. Otherwise leave it empty. Email and global database limits still apply. Add host-level bot/rate controls appropriate to campaign volume.
6. Replace localhost metadata with the public origin and verify canonical social images, sitemap, and robots output. Admin and management pages are marked noindex.
7. Run lint, TypeScript, unit/database tests, production build, and browser tests. Add real cross-browser testing if Safari/Firefox support is commercially critical.

The app uses CSP, origin validation, bounded JSON bodies, schema validation, a honeypot, shared database limits, server-only secrets, authorization checks, and RLS. These controls do not substitute for a deployment review and monitoring. Production dependencies currently pass the npm advisory check; development lint tooling has a transitive `braces` advisory with no compatible upstream fix. Do not apply `npm audit fix --force`, which proposes downgrading the Next lint configuration across major versions.

## Directory layout

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
