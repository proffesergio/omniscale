# OmniScale backlog — what is NOT built yet

Scope rule: P0 is the complete MVP (nothing public before it is green).
P1 items are user-accepted (D11–D14) but post-MVP unless the owner reorders.
P2 is hardening/polish. Non-goals are listed at the bottom — do not build them
without a new user decision.

## P0 — MVP launch blockers

- [ ] **B01 Push + hosting.** No git remote exists today. `git remote add origin … &&
      git push -u origin main`, import into Vercel with Root Directory `apps/web`.
      Full steps in `docs/DEPLOY.md`.
- [ ] **B02 Staging database + live smoke.** Apply `supabase/migrations/001→003` in order;
      set every var from `apps/web/.env.example` (`ADMIN_TOKEN` ≥ 32 chars). Then verify
      for real: audit submit → slot publish → book → cancel/reschedule → TrxID submit →
      team email → verify; plus simultaneous bookings from independent connections
      (PGlite tests are single-connection — the race was never exercised live).
- [ ] **B03 Commercial confirmation (D18).** Prices in `apps/web/src/lib/pricing.ts` are
      placeholders; publish real bKash/Nagad/Rocket methods + QR scans (`public/qr/`)
      via `/admin` before any visitor sees `/pricing`.
- [ ] **B04 Scheduler + providers.** Cron `POST /api/internal/notifications` with
      `CRON_SECRET`; Resend (`RESEND_API_KEY`, `BOOKING_FROM_EMAIL`, `CONTACT_EMAIL`);
      audit webhook (`AUDIT_WEBHOOK_*`). No outbound notification has ever been sent —
      verify delivery, backoff, and the 8-attempt dead-letter path.
- [ ] **B05 Domain cutover.** Point DNS at Vercel, set `NEXT_PUBLIC_SITE_URL` to the exact
      public origin and **redeploy** (`NEXT_PUBLIC_*` bake into the build), then verify
      sitemap/robots/canonical/OG image, noindex on `/admin` + manage pages.
- [ ] **B06 Policy + safety net.** Privacy contact, data-retention rule (no auto-delete
      exists today), Supabase backup + restore drill.

## P1 — accepted features, not built (D11–D14)

- [ ] **B07 Blog/insights + newsletter (D11).** New `app/blog/` routes + subscribe form;
      Resend-backed, stored via outbox pattern (`lib/intake.ts`, `lib/notifications.ts`);
      extend `app/sitemap.ts`. No invented results — educational content only.
- [ ] **B08 Gated lead magnets (D12).** Resource index + email-gated downloads feeding the
      audit pipeline; no ungated capture bypass. Likely new table + `submit_*` RPC
      following `003_payments.sql` as the template.
- [ ] **B09 Nurture sequences + reminders (D13).** Outbox-backed lead follow-ups and
      booking reminders via Resend; unsubscribe handling required. Reuses worker
      (`app/api/internal/notifications/route.ts`) with new `kind` values.
- [ ] **B10 Testimonial approval workflow (D14).** Admin-gated publishing queue requiring
      source URL + approval date (see `Testimonial` in `src/types/index.ts`); nothing
      public without evidence, per D06.

## P2 — hardening and polish

- [ ] **B11 Observability.** `/api/health`, structured logs, outbox queue alerts on the
      admin dashboard (counts exist, alerts do not).
- [ ] **B12 Abuse review.** `TRUSTED_IP_HEADER` decision (stays empty unless the proxy
      guarantees overwrite), rate-limit/bot tuning for campaign volume.
- [ ] **B13 Motion system.** CSS-first reveals + hero micro-interactions, honored
      `prefers-reduced-motion`, zero layout shift. Tailwind 4 is CSS-first
      (`@theme` in `globals.css`) — no `tailwind.config.ts`.
- [ ] **B14 Route polish.** Loading/error/empty states on audit, booking, manage, admin;
      responsive QA (admin tables → cards); full axe pass (today: homepage only);
      performance pass; prod SEO verify.
- [ ] **B15 Calculator upgrades.** Shareable link state, PDF/print export. Disclosures stay:
      modeled, never guarantees, currency switch starts a new example (no FX).
- [ ] **B16 Admin CRM.** Pipeline stages, notes, assignment, CSV export. Reuse the keyset
      cursor pattern (`lib/pagination.ts`, `?after=&limit=`, 50/page).
- [ ] **B17 Multi-user admin.** Revisit D19 (shared `ADMIN_TOKEN`) only on explicit request;
      the unused `public.admins` allowlist is still in the schema.
- [ ] **B18 Browser matrix.** Safari/Firefox if commercially critical (today: Chrome
      desktop + mobile emulation only).

## Non-goals (need a new user decision)

Calendly, automatic meeting-URL creation, external calendar conflict detection,
FX conversion, fabricated clients/testimonials/metrics/verified ROI,
`npm audit fix --force` (downgrades Next lint across majors — see CURRENT.md).
