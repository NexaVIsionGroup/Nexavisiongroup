# NexaVisionGroup — Claude Context
> Last updated: 2026-03-31

## Stack
Next.js 14 App Router + Sanity CMS + Tailwind CSS + Framer Motion + Supabase (admin)

## Critical Rules
- `.npmrc` must have `legacy-peer-deps=true` or Vercel build fails
- Framer Motion bezier arrays: cast as `as [number, number, number, number]` in TypeScript
- Use proven dep versions: `next-sanity@^9.8.0`, `sanity@^3.40.0`, `styled-components`
- Root `nexavisiongroup/` is NOT a git repo — only `nexavisiongroup/git/` is committed
- Sanity content not yet populated — all pages use fallback data from `src/lib/fallback-data.ts`
- **DO NOT use Netlify** — DNS points to Vercel. Netlify deploys go nowhere.

## Local Path
`C:\websites\nexavisiongroup\git\`

## Deploy — VERCEL ONLY

> ⚠️ **CRITICAL — verify the project link FIRST.** `.vercel/project.json` has
> been found linked to the WRONG Vercel project (`prj_pm6…` / name "git",
> which is **RO Unlimited's LIVE site** — rounlimited.com). Deploying with the
> wrong link overwrites RO Unlimited's production. **Do NOT trust any claim
> that the link is already correct.**

**Mandatory pre-deploy check:**
```bash
cd "C:/Users/databackup/Desktop/websites/nexavisiongroup/git"
cat .vercel/project.json
# projectId MUST equal prj_ld75CmyLdlgX8WxX45fiebbgMn1P (name "nexavisiongroup").
# If it shows prj_pm6… / "git", STOP and rewrite it to:
# {"projectId":"prj_ld75CmyLdlgX8WxX45fiebbgMn1P","orgId":"team_1b8fRiUKV3SdeniHIRBvwJ9l","projectName":"nexavisiongroup"}
```
**Deploy:**
```bash
VERCEL_TOKEN=<see PROJECT_INFO.md> npx vercel --prod --yes \
  --token <vercel token> --scope nates-projects-795d90f3
```
**Post-deploy check:** the deploy log MUST show `▲ Aliased https://nexavisiongroup.com`
(never `rounlimited`). Then purge Cloudflare (below). The nexavisiongroup
Vercel project has NO Git connection — GitHub pushes do not auto-deploy; CLI only.
All tokens/keys are in `PROJECT_INFO.md` (one level up from this `git/` folder).

### Cache Purge (if changes don't appear after deploy)
```bash
# Cloudflare zone: 74a7cc841e83375fbedc700a79121fe7 — credentials in PROJECT_INFO.md
curl -X POST "https://api.cloudflare.com/client/v4/zones/74a7cc841e83375fbedc700a79121fe7/purge_cache" \
  -H "X-Auth-Email: <CF email>" -H "X-Auth-Key: <CF key>" \
  -H "Content-Type: application/json" --data '{"purge_everything":true}'
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

### Cloudflare DNS
| Key | Value |
|-----|-------|
| Zone ID | `74a7cc841e83375fbedc700a79121fe7` |
| Nameservers | ns1/ns2.vercel-dns.com |
| Credentials | See PROJECT_INFO.md |

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
| `.vercel/project.json` | Links CLI to correct Vercel project (prj_ld75CmyLdlgX8WxX45fiebbgMn1P) |
