# Deploying OmniScale (GitHub → Vercel)

## One-time setup

```bash
# 1. Create an empty GitHub repo (web UI or gh), then:
git remote add origin git@github.com:<you>/omniscale.git
git push -u origin main
```

2. In Vercel, **Add New → Project → import `omniscale`**:
   - Framework: Next.js (auto-detected). **Root Directory: `apps/web`.**
   - Node.js 22 (default).
3. Set **Environment Variables** (Production + Preview) from `apps/web/.env.example`:
   `NEXT_PUBLIC_SITE_URL` (exact origin, e.g. `https://omniscale.agency`),
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
   `SUPABASE_SECRET_KEY`, `RATE_LIMIT_SECRET`, `CRON_SECRET`,
   plus providers you use (`AUDIT_WEBHOOK_*`, `RESEND_API_KEY`, `BOOKING_FROM_EMAIL`,
   `CONTACT_EMAIL`, Stripe proof vars). Never commit `.env.local`.
4. Apply `supabase/migrations/*.sql` **in filename order** to staging/prod and set
   `ADMIN_TOKEN` — no Supabase Auth users needed for the team panel.

## Scheduler (notifications worker)

Vercel Cron is GET-only, but `/api/internal/notifications` needs
`POST` + `Authorization: Bearer <CRON_SECRET>`. Use an external scheduler that
supports headers (or this optional GitHub workflow — add repo secrets
`SITE_URL` and `CRON_SECRET` first):

```yaml
# .github/workflows/notify.yml
on:
  schedule:
    - cron: '*/5 * * * *' # GitHub minimum cadence; outbox lease tolerates it
  workflow_dispatch:
jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - run: >
          curl -fsS -X POST "$SITE_URL/api/internal/notifications"
          -H "Authorization: Bearer $CRON_SECRET"
        env:
          SITE_URL: ${{ secrets.SITE_URL }}
          CRON_SECRET: ${{ secrets.CRON_SECRET }}
```

## Launch checklist (complete MVP = all boxes ticked)

Push to `main` → GitHub Actions runs `lint → typecheck → test → build` →
Vercel auto-deploys on green. PRs get preview deployments (set the same env vars
on Preview, with a preview `NEXT_PUBLIC_SITE_URL`).

- [ ] **Repo + project.** Remote added, `main` pushed, Vercel project imported
      (Root Directory `apps/web`), CI green on the push.
- [ ] **Database.** All three migrations applied **in filename order** to staging
      (`001_omniscale` → `002_pagination` → `003_payments`); verify tables
      `slots/bookings/audit_submissions/outbox/payment_methods/manual_payments` exist.
- [ ] **Secrets.** All `apps/web/.env.example` vars set in Vercel (Production).
      `ADMIN_TOKEN` / `RATE_LIMIT_SECRET` / `CRON_SECRET` each `openssl rand -hex 32`.
      `RATE_LIMIT_SECRET` must stay stable across deploys (booking links derive from it).
- [ ] **Staging smoke (do not skip).** Sign in at `/admin` with `ADMIN_TOKEN`; publish a
      slot; in a private window submit an audit, book, cancel via the manage link;
      reschedule from admin; submit a TrxID on `/pricing` and verify it. Fire two
      bookings at the same slot from independent sessions to prove the race guard.
- [ ] **Notifications.** Scheduler live (cron snippet above or external), one real audit
      webhook + one booking email + one payment notice delivered; confirm retries settle
      and dead-lettered rows are visible in the admin counts.
- [ ] **Commercial ready.** Pricing figures confirmed (no placeholders), real payment
      methods + QR published, initial availability published.
- [ ] **Domain.** DNS → Vercel, `NEXT_PUBLIC_SITE_URL` = exact public origin, then
      **redeploy** — `NEXT_PUBLIC_*` values bake into the build, editing the var alone
      changes nothing until the next deployment. Re-verify sitemap/robots/canonical/OG
      and noindex on `/admin` + manage pages.
- [ ] **Policy.** Privacy contact published, retention rule decided, Supabase backup
      enabled with a restore drill noted.

Browser tests (`npm run test:e2e`) stay local: they need Chrome and a production
build (`npm run build && npm run test:e2e`). Re-run them after any pre-launch change.
