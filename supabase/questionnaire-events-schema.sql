-- Questionnaire analytics: what a client does on their /q/<token> link.
-- Written by the public endpoint /api/q/[token]/event (token = credential),
-- read by /admin/questionnaires/[id]/stats. Service-role only.
create table if not exists public.questionnaire_events (
  id bigint generated always as identity primary key,
  questionnaire_id uuid not null references public.client_questionnaires(id) on delete cascade,
  visit text not null,                 -- one id per tab/open
  device text,                         -- stable per-browser id (localStorage), null if blocked
  event text not null,                 -- visit | view | calc | zone | start | step | access | send | end
  section text,                        -- what was viewed / which step / which platform
  meta jsonb not null default '{}'::jsonb,
  ua text,
  referrer text,
  screen text,                         -- "390x844"
  tz text,
  created_at timestamptz not null default now()
);

create index if not exists questionnaire_events_q_idx
  on public.questionnaire_events (questionnaire_id, created_at desc);

alter table public.questionnaire_events enable row level security;
