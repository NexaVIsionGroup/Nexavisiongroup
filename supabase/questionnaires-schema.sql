-- Client Questionnaires: token-link forms that clients fill out (autosave),
-- reviewed in /admin/questionnaires. Template definitions live in code
-- (src/lib/questionnaires); answers are stored as JSON keyed by field id.
create table if not exists public.client_questionnaires (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  template text not null default 'household-budget',
  title text not null,
  client_name text,
  client_email text,
  client_phone text,
  customer_id uuid,
  status text not null default 'pending'
    check (status in ('pending','in_progress','submitted','reviewed','archived')),
  answers jsonb not null default '{}'::jsonb,
  extra_questions jsonb not null default '[]'::jsonb,
  current_section int not null default 0,
  admin_notes text,
  created_by text,
  open_count int not null default 0,
  last_opened_at timestamptz,
  last_saved_at timestamptz,
  submitted_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists client_questionnaires_status_idx
  on public.client_questionnaires (status, updated_at desc);

-- Service-role only (API routes). No anon policies = no direct client access.
alter table public.client_questionnaires enable row level security;
