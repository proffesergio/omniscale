# Accepted decisions

Decision dates reflect the conversation available on 2026-10-14. User choices outrank inferred preferences.

| ID  | Decision                                                                          | Status / reason                                                                  |
| --- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| D01 | Brand and project name: OmniScale                                                 | Accepted by user; domain availability is not verified                            |
| D02 | Next.js App Router + TypeScript + Tailwind                                        | User selected frontend A                                                         |
| D03 | Supabase/PostgreSQL backend                                                       | User selected backend A; Server Actions remain part of the intended architecture |
| D04 | Own appointment booking with admin controls                                       | Latest user instruction; supersedes the initial Calendly choice                  |
| D05 | Suggest currency from visitor location; permit manual override                    | Accepted; exact detection fallback is an implementation choice                   |
| D06 | Use clearly labeled illustrative creative blueprints                              | Accepted by user; no fabricated client performance or testimonials               |
| D07 | Target global high-ticket clients, mainly through LinkedIn, from Bangladesh       | Original product brief                                                           |
| D08 | Prioritize funnel economics, creative velocity, product research and media buying | Original competitive positioning                                                 |
| D09 | Calculator must support CAC, LTV, ROAS and MER                                    | Original requirement; extra inputs and explicit assumptions needed               |
| D10 | Keep repository-local memory, stage tracking, resume workflow and tool governance | Requested in this side conversation                                              |
| D11 | Blog/insights engine + newsletter capture (Resend-powered subscribe)          | Accepted 2026-10-15; content flywheel for lead generation                        |
| D12 | Gated lead-magnet library feeding the audit pipeline                          | Accepted 2026-10-15; email-gated downloads, no ungated lead capture bypass      |
| D13 | Automated nurture: lead follow-up sequences + booking reminders via Resend    | Accepted 2026-10-15; outbox-backed, unsubscribe handling required                |
| D14 | Testimonial/case-study approval workflow (source URL + approval date)         | Accepted 2026-10-15; nothing public without evidence, per D06                    |
| D15 | Pricing/engagement-models page with strict no-guaranteed-ROI copy            | Accepted 2026-10-15; tiers route into audit/booking                              |
| D16 | Git on `main` + GitHub Actions CI + Vercel auto-deploy (Root Dir `apps/web`)  | Accepted 2026-10-15; E2E stays local (Chrome + prod build)                       |
| D17 | Manual BD mobile-bank payments (bKash/Nagad/Rocket), personal QR managed in admin, TrxID verification queue; no gateway, no auto-capture | Accepted 2026-10-15; QR under `public/qr/` or data URI (CSP), team notified via CONTACT_EMAIL |
| D18 | Pricing figures in `src/lib/pricing.ts` are owner-unconfirmed placeholders     | Pending owner confirmation before launch; payment alone never implies ROI         |

## Implementation choices to preserve unless evidence warrants revision

- npm workspace with the application under `apps/web`.
- Warm off-white, charcoal, sage and orange visual direction.
- Manual currency preference stored locally; location suggestion falls back to timezone; changing calculator currency starts a separate example rather than claiming an exchange conversion.
- Server-only database secrets; Supabase auth helper and admin allowlist table.
- Atomic reservation SQL and durable notification outbox.
- Blueprint targets remain illustrative; testimonial data remains empty until approved evidence is supplied.

These are implementation choices, not claims of verified operation or independent user approval.

## Changes and supersession

- Calendly is superseded. Do not add it back without a new user decision.
- Tailwind v4 uses CSS-first configuration in the current scaffold. The original directory sketch's `tailwind.config.ts` is not itself proof of a missing feature.
- A local repository is present. No hosting decision or completed deployment is established by this checkpoint.
- No new MCP connection or skill installation is authorized merely by its inclusion in TOOLS.md.

## Implementation checkpoint — 2026-10-15

- The local Next.js implementation now includes the visitor routes, owned scheduling, calendar export, admin actions, notification worker, and private Stripe evidence adapter.
- Booking uses one calendar and fixed 30-minute slots, published 2 hours to 90 days ahead. No video link creation or external calendar synchronization is implied.
- Supabase, notification providers, privacy contact, and a hosting target still require configuration. No deployment occurred.
- Standard Next.js was retained to honor the selected architecture. The Sites skill was consulted for presentation and preview guidance; no hosted Site was created.
- Live API success is not inferred from mocked browser responses or embedded database tests. Preserve these verification limits in future handoffs.
