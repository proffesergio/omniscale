# Current project stage

Checkpoint date: 2026-10-15 (Asia/Dhaka). Reconciled against HEAD `120b15d` with a clean
working tree; no remote configured; no dev server running; no `.env.local` present.
Checkpoint source: main implementation and local verification; supersedes the earlier side-conversation inventory.
Overall state: **MVP code-complete and locally verified; staging + deployment untouched**.
Next milestone: B01–B02 — push `main` to GitHub, import into Vercel, provision staging
Supabase, run the live smoke suite. Full ordered list: `BACKLOG.md` (P0) + `docs/DEPLOY.md`.

## Implemented behavior

- Responsive landing page, local fonts, CSS/SVG creative artwork, mobile navigation, metadata, social image, sitemap, robots, privacy page, and error states.
- Full funnel calculator with CAC, gross-profit LTV, ROAS, MER, explicit assumptions, hypothetical efficiency gap, and revenue/gross-profit scenarios. Inputs remain in the browser.
- Filterable illustrative blueprints with dedicated detail pages. No invented clients or achieved results.
- Three-step React Hook Form/Zod audit wizard, validated API, durable database intake, idempotency, rate limits, and transactional notification outbox.
- Owned booking flow: timezone selection, 30-minute slots, calendar download, private management link, cancellation, and transparent unconfigured states.
- Protected admin access via shared-token sealed sessions (12h HTTP-only cookie), slot publishing/closing, appointment status/rescheduling, lead pipeline, payment-method management, TrxID verification queue, notification queue counts.
- Manual currency preference precedes country/timezone suggestions. A late location response cannot overwrite manual choice. Currency changes start a new example; no FX claim.
- Authenticated notification worker with leases, retries, generic signed webhooks, Slack/Discord adapters, and optional Resend appointment emails.
- Private optional Stripe evidence module checks explicitly approved captured, undisputed live charges and keeps currency totals separate. It does not claim verified ROI or publish payment data.

## Implemented behavior (continued 2026-10-15)

- Keyset pagination: admin slots/bookings/audits/manual-payments page 50 at a time
  (`sAfter`/`bAfter`/`aAfter`/`pAfter` + `pStatus`); availability pages via
  `GET /api/availability?after=&limit=` (max 200) with “Show more times” in the calendar.
  New migration `002_pagination.sql` redefines `available_slots(after, limit)`.
- Manual BD payments: `003_payments.sql` (`payment_methods`, `manual_payments`,
  `submit_manual_payment` RPC with idempotency + `payment` outbox entries), admin QR/method
  management and TrxID verification queue, `/pricing` page with engagement models and a
  TrxID submit form, team notification to `CONTACT_EMAIL` via Resend. No gateway integration.
- Git repo initialized on `main` (HEAD `120b15d`; `0aca55e`, `2254d22`, `c7fa185` before it);
  GitHub Actions CI runs `lint → typecheck → test → build`; `docs/DEPLOY.md` covers the
  Vercel flow. No remote configured yet — push and Vercel import are the next human steps.
- Token-only admin auth: shared `ADMIN_TOKEN` (≥32 chars) signs into a sealed 12-hour
  HTTP-only cookie; no Supabase Auth users, no allowlist lookups. Supabase-user helpers
  removed; the `public.admins` table stays in schema unused (see D19).

## Verification ledger

Commands were run from the project root using the `rtk proxy` prefix.

| Check                     | Latest result and scope                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run lint`            | Passed against final source                                                                                                                 |
| `npm run typecheck`       | Passed; final `npm run build` also completed TypeScript checks                                                                              |
| `npm test`                | 49 tests passed across financial, validation, request security, Stripe adapter, pagination, payments, admin token auth, and PostgreSQL suites |
| PostgreSQL suite          | 14 tests passed; all migrations applied to PGlite in filename order              |
| `npm run build`           | Passed on Next.js 16.4.1; 22 static/generated outputs plus dynamic API/admin routes                                                         |
| `npm run test:e2e`        | 16 tests passed on desktop and mobile Chrome projects against the production build (incl. new pricing fail-closed test) |
| Accessibility and visuals | No serious/critical WCAG A/AA findings on tested homepage viewports; no horizontal overflow; screenshots visually reviewed                  |
| `npm audit --omit=dev`    | 0 vulnerabilities reported                                                                                                                  |
| Full dependency audit     | 5 high development-tool advisories remain via Next ESLint → fast-glob → micromatch → braces; no compatible upstream fix in the audit report |
| Live Supabase / providers | Not configured or tested; unavailable-state behavior verified; no `.env.local` on this machine |
| Deployment                | Not started; no remote, no public URL, no hosting account                                                        |

Screenshots: `apps/web/test-results/omniscale-desktop.png` and `apps/web/test-results/omniscale-mobile.png` (ignored generated artifacts, recreated by browser tests).

## Verification limits

- PGlite uses one connection. Database constraints and transactional behavior were exercised, but independent live connections racing for a slot were not.
- The successful booking browser journey uses a mocked API. The real unconfigured API was verified to fail closed; it was not mistaken for a successful Supabase integration.
- Live admin login, session expiry, email delivery, audit webhooks, and Stripe data access need configured staging services.
- Browser coverage is Chrome desktop/mobile emulation, not a full Safari/Firefox matrix. Accessibility automation is scoped to the homepage and does not replace manual assistive-technology review.
- Vitest was upgraded to remove vulnerable test-runner dependencies. Do not run forced audit fixes that downgrade Next ESLint across major versions.

## Ordered continuation queue

> The full pending-feature list now lives in `BACKLOG.md` (P0 = MVP launch blockers
> B01–B06, P1 = accepted post-MVP features, P2 = hardening). This queue is only the
> immediate resume order:

1. Read AGENTS.md, this file, `BACKLOG.md`, and `DECISIONS.md`; reconcile with `git log` and the working tree without printing secrets.
2. B01: `git remote add origin … && git push -u origin main`; import into Vercel with Root Directory `apps/web` (see `docs/DEPLOY.md`).
3. B02: provision staging Supabase (migrations 001→003 in order), set all env vars, and run the live smoke suite — audit, book/cancel/reschedule, TrxID→verify, concurrent-booking race.
4. B03–B06: confirm pricing/QR, wire scheduler + providers, cut over the domain (redeploy after `NEXT_PUBLIC_SITE_URL` change), set retention/backup policy.

## Operating limits to preserve

- One calendar, fixed 30-minute slots, booking window of 2 hours to 90 days. No automatic meeting URL or external-calendar conflict detection.
- Admin lists and availability are keyset-paginated (50/page admin, 200 max availability) — never treat one page as a complete archive.
- A saved booking is authoritative even if an email fails. Private management links must remain private. Secrets never belong in memory files.
- User selected Next.js; the Sites skill supplied design/preview guidance only. No framework substitution or hosted Site registration occurred.

## Environment and handoff

- Git repo on `main`, HEAD `120b15d`, working tree clean, **no remote**. No dev server
  running; tests own their temporary servers. No `.env.local` on this machine — the next
  session starts with zero staging credentials and must not invent any.
- The shell sandbox failed at startup with `bwrap: loopback: Failed RTM_NEWADDR` in an
  earlier session; approved commands ran outside it.

Run `rtk proxy npm run dev` from the repo root and open `http://localhost:3000` to review
the local site (unconfigured states until Supabase + `ADMIN_TOKEN` are set — see README
“Test the admin panel locally”). Root model switching was unavailable mid-session in an
earlier checkpoint; one explicitly routed `gpt-6-sol` worker handled isolated database
tests and contrast fixes, and the root verified the results.
