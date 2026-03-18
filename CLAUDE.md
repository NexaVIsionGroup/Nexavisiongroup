# NexaVisionGroup — Claude Context
> Last updated: 2026-03-02

## Stack
Next.js 14 App Router + Sanity CMS + Tailwind CSS + Framer Motion + Supabase (admin)

## Critical Rules
- `.npmrc` must have `legacy-peer-deps=true` or Vercel/Netlify build fails
- Framer Motion bezier arrays: cast as `as [number, number, number, number]` in TypeScript
- Use proven dep versions: `next-sanity@^9.8.0`, `sanity@^3.40.0`, `styled-components`
- Root `nexavisiongroup/` is NOT a git repo — only `nexavisiongroup/git/` is committed
- Sanity content not yet populated — all pages use fallback data from `src/lib/fallback-data.ts`

## Local Path
`C:\websites\nexavisiongroup\git\`

## Deploy Commands
```bash
# Netlify (active host)
cd /c/websites/nexavisiongroup/git
npx netlify-cli deploy --prod  # needs NETLIFY_AUTH_TOKEN + NETLIFY_SITE_ID env vars

# Vercel
npx vercel --prod  # needs VERCEL_TOKEN env var
# or: nexpush (PowerShell)
```

## GitHub
- Org: `NexaVIsionGroup`
- Repo: `github.com/NexaVIsionGroup/Nexavisiongroup` (branch: `master`)
- Credentials: See `C:/websites/nexavisiongroup/PROJECT_INFO.md`

### Sanity
| Key | Value |
|-----|-------|
| Project ID | `7fpz8y54` |
| Dataset | `production` |
| Studio URL | `nexavisiongroup.com/studio` |
| CORS origins needed | `nexavisiongroup.com`, `nexavisiongroup.vercel.app`, `localhost:3000` |

### IONOS DNS
| Key | Value |
|-----|-------|
| Zone ID | `bc8b00fa-7a3f-11f0-8177-0a5864440d79` |
| Auth | `X-API-Key: 660f4b1f48ad4df8a6c848c29147b899.1I9TCWlacxl5FT2V9mA00xt59FtSq3a0Qsba83MFVod1VnDfl3hOedJY2S2fFrTfUiJHHFmh59QAXJyYN1_Oqg` |
| Nameservers | ns1/ns2.vercel-dns.com (set, propagation pending) |

## Pages Built (Batches 1–5)
| Batch | What | Route |
|-------|------|-------|
| 1 | 8 UI components + layout | shared |
| 2 | Industries Hub | `/industries` |
| 3 | 10 dynamic industry pages | `/industries/[slug]` |
| 4 | Systems page | `/systems` |
| 5 | Demos Gallery | `/demos` |

## Pages Still Needed
- `/lab` — Systems Lab
- `/pricing` — Pricing page
- `/contact` — Contact / Quote form
- `/about` — About page
- `/privacy`, `/terms` — Legal

## Admin App (Phase 1 — Foundation)
- **Routes**: `/admin`, `/admin/login`, `/admin/inbox`, `/admin/customers`, `/admin/proposals`, `/admin/invoices`, `/admin/analytics`, `/admin/settings`
- **Auth**: Supabase Auth (email/password) + middleware protection
- **Roles**: admin, team_member, developer
- **Invite system**: `/admin/join/[token]` (30-day expiry)
- **Access links**: `/admin/access/[token]` (24-hour passwordless login)
- **DB migration**: `supabase/phase1-schema.sql` — run in Supabase SQL Editor
- **Stripe**: Shared JHPS keys, `brand: 'nexa'` metadata on all payments
- **Customers page**: Full CRUD with search, type filters, create modal

## Key Files
| File | Purpose |
|------|---------|
| `src/lib/fallback-data.ts` | Homepage, nav, footer, pricing fallback |
| `src/lib/industry-fallbacks.ts` | All 10 vertical industry fallback data |
| `src/lib/supabase/client.ts` | Client-side Supabase instance |
| `src/lib/supabase/server.ts` | Server-side admin client (service role) |
| `src/lib/supabase/middleware.ts` | Auth middleware for /admin routes |
| `src/components/admin/AppShell.tsx` | Admin layout (sidebar, header, mobile nav) |
| `src/components/admin/AuthGuard.tsx` | Client-side auth protection |
| `supabase/phase1-schema.sql` | Phase 1 database schema |
| `sanity/lib/queries.ts` | All GROQ queries |
| `sanity/lib/client.ts` | Sanity client (uses "placeholder" if env empty) |
| `netlify.toml` | Netlify build config + `@netlify/plugin-nextjs` |
| `.vercel/project.json` | Links CLI to correct Vercel project |
