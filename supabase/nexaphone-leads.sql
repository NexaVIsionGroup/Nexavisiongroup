-- Nexa Pro inbound leads: fleet quotes, technical guide requests, phone questions
create table if not exists public.nexaphone_leads (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('quote','guide','question')),
  status text not null default 'new' check (status in ('new','contacted','won','lost')),
  name text not null,
  email text not null,
  phone text,
  company text,
  units integer,
  location text,
  device text,
  message text,
  created_at timestamptz not null default now()
);
alter table public.nexaphone_leads enable row level security;
create index if not exists nexaphone_leads_created_idx on public.nexaphone_leads (created_at desc);
