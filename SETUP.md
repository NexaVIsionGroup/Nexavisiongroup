# Verification feature — setup & go-live

All code is written. The steps below are the human-owned actions
(intentionally not done by an AI with production keys).

## 1. Database (run once, ~60s)
Supabase SQL editor -> paste `supabase/verification-schema.sql` -> Run.
Requires `phase1-schema.sql` to already be applied (it is).

## 2. Storage bucket (run once)
Storage -> New bucket -> name `verification-docs` -> Public toggle OFF.

## 3. Env vars (already present, plus one new)
Reuses NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
RESEND_API_KEY, NEXT_PUBLIC_SITE_URL.
Add: CRON_SECRET = <random string> (for the cleanup endpoint).

## 4. Retention cron (optional but recommended)
Add to vercel.json:
  { "crons": [ { "path": "/api/admin/verify/cleanup", "schedule": "0 4 * * *" } ] }
Vercel Cron sends CRON_SECRET as the Bearer token automatically.

## 5. Auth
/api/admin/verify and /api/admin/verify/cleanup must sit behind the same
admin auth as your other /api/admin/* routes. Confirm middleware covers
/api/admin/* (it should via the existing AuthGuard/middleware pattern).

## 6. Deploy (run by a developer, after review)
A human runs the prod deploy after the team has reviewed:
  npx vercel --prod   (or your usual `nexpush`)
Review first, then go live — this collects customer ID documents.

## Flow
Admin -> Verify -> New request -> pick customer (emails them a 7-day link)
Customer opens /verify/<token> -> uploads Gov ID + selfie (+ supporting)
Admin -> Verify -> Review -> views docs via 5-min signed URLs -> Approve/Reject
All create/submit/view/decision actions are written to activity_log.