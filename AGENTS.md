# OmniScale — agent instructions

Next.js App Router + strict TypeScript + Tailwind 4 + Supabase/PostgreSQL. npm workspace; app lives at `apps/web` (`@omniscale/web`, alias `@/*` → `apps/web/src/*`).

## Commands (repo root, Node ≥ 22)

```bash
npm run lint        # eslint, workspace apps/web
npm run typecheck   # tsc --noEmit
npm test            # vitest run (unit + PGlite DB suite)
npm run build       # next build — required before e2e
npm run test:e2e    # playwright vs production build
```

- Root scripts delegate to the workspace; run from repo root. Some environments need network via `rtk proxy` prefix (e.g. `rtk proxy npm install`) — see README.
- Verify in order: `lint → typecheck → test → build → test:e2e`.
- Never `npm audit fix --force`: it downgrades the Next lint config across majors (known transitive `braces` advisory in dev lint tooling; prod audit is clean).

## Gotchas

- E2E (`apps/web/playwright.config.ts`) launches `npm run start`, so `build` must pass first. Needs Chrome at `/usr/bin/google-chrome` or `CHROME_PATH` override; covers desktop + mobile Chrome only. The booking browser test mocks the API — real booking/cancellation is covered by the PGlite DB suite and needs staging for live verification.
- DB tests apply `supabase/migrations/001_omniscale.sql` to embedded PGlite (single connection — live double-booking races need staging with independent connections).
- Tailwind 4 is CSS-first (`@theme` in `globals.css`); there is no `tailwind.config.ts`.
- `server-only` marks server secrets; never prefix the server Supabase key with `NEXT_PUBLIC_`.
- `NEXT_PUBLIC_SITE_URL` must be the exact origin (scheme + port). `TRUSTED_IP_HEADER` stays empty unless the hosting proxy guarantees it overwrites that header.
- `RATE_LIMIT_SECRET` (≥32 chars) must stay stable — booking management links derive from it; rotation invalidates regeneration.
- Admin gore: slots are fixed 30-min, bookable 2h–90 days ahead, stored UTC. Admin lists page 50 at a time via keyset cursors (`sAfter`/`bAfter`/`aAfter`); availability pages via `?after=&limit=` (max 200). Never treat one page as a complete archive. Closing a slot never cancels its booking. Booking records are authoritative even if notification delivery fails (outbox retries to 8 attempts, at-least-once).
- Git + CI: `main` branch; push → GitHub Actions (`lint → typecheck → test → build`) → Vercel auto-deploy (Root Directory `apps/web`). E2E stays local (needs Chrome + prod build). See `docs/DEPLOY.md`. `.env*` (except `.env.example`) is gitignored — never commit secrets or store them in `docs/project-memory/`.

## Supabase setup (staging/prod)

1. Apply `supabase/migrations/*.sql` in order. 2. Copy `apps/web/.env.example` → `apps/web/.env.local`; set Supabase URL/keys, server `SUPABASE_SECRET_KEY`, `RATE_LIMIT_SECRET`, `CRON_SECRET`, `ADMIN_TOKEN` (≥32 chars, random), origin, providers. 3. Sign in at `/admin` with `ADMIN_TOKEN` — no Supabase Auth user needed (`public.admins` is unused while token auth is active). Full checklist in README. An unapplied migration or unconfigured provider is not a working feature — the app fails closed and says so.

## Invariants (do not violate without a new user decision)

- Own booking/admin system supersedes Calendly — do not re-add it.
- No fabricated clients, testimonials, metrics, or verified ROI. Blueprints in `src/lib/blueprints.ts` are illustrative; calculator outputs are modeled, never guarantees; currency switch starts a new example, never FX conversion (manual USD/EUR/BDT pref → Vercel country header → timezone → USD).
- Calculator changes must keep assumptions disclosed and distinguish modeled from observed results.
- No automatic meeting-URL creation or external calendar conflict detection — team supplies meeting details, publishes only genuinely free slots.

## Memory (lightweight)

Before substantive work read `docs/project-memory/CURRENT.md` (stage/evidence/next) and `DECISIONS.md` (accepted scope); `WORKFLOW.md` + `TOOLS.md` cover handoff and tool authorization. Memory is a checkpoint, not authority — reconcile with source. After a milestone, update CURRENT with commands run, outcomes, and remaining gaps.
