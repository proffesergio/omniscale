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

## Flow

- Push to `main` → GitHub Actions runs `lint → typecheck → test → build` →
  Vercel auto-deploys on green. PRs get preview deployments.
- Browser tests (`npm run test:e2e`) stay local: they need Chrome and a production
  build (`npm run build && npm run test:e2e`).
- After deploy: smoke-test audit submit, booking/cancel/reschedule, admin login,
  and one notification delivery against staging before pointing the domain at it.
