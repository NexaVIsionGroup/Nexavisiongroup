# Prospects (staging on the NexaVision stack)

New potential clients are staged here **before** they have their own stack.
Nothing in this folder is a client's production system.

| Piece | Where |
|---|---|
| Check-up template (findings briefing + access cards + questions) | `src/lib/prospects/<client>/checkup.ts` |
| Screenshots / photos used in the briefing | `public/p/<client>/` |
| Shared prospect UI (briefing, calculator, setup wizard) | `src/components/prospect/` |
| Public link | `nexavisiongroup.com/q/<token>` (create in `/admin/questionnaires`, pick the client's template) |
| Answers | Nexa Supabase `client_questionnaires` (passwords sealed with `QUESTIONNAIRE_SECRET_KEY`, revealed one at a time in admin) |

## Adding a prospect
1. Copy `thai-station-cafe/` to `<client-slug>/`, rewrite `checkup.ts` (brief + sections), give it a unique `id`.
2. Put images in `public/p/<client-slug>/`.
3. Add it to `PROSPECT_TEMPLATES` in `index.ts`.
4. Create the link in `/admin/questionnaires`.

## When a prospect becomes a client
Their real site gets its own GitHub org, Vercel team and Supabase project (no credential
overlap). Move their notes there, set the questionnaire to Archived, and delete their
folder here plus `public/p/<client-slug>/` once nothing links to it.

## Current prospects
- `thai-station-cafe`: Thai Station Cafe, Babylon NY (audit 2026-10-31). Handover: `C:\websites\thai-station-cafe\HANDOVER.md`
