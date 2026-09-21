-- Virtual cloud phones: one row per VM user. Service-role only (RLS on, no policies).
-- A row is created by an admin "sign-up link" (invite). The invitee sets username+password.
create table if not exists public.vm_users (
  id              uuid primary key default gen_random_uuid(),
  label           text not null default '',          -- admin's note: who this is for
  username        text unique,                       -- null until the invite is redeemed
  password_hash   text,                              -- scrypt: salt:hash (hex)
  phone_id        text unique,                       -- phone1|phone2|phone3 ; null = unassigned
  enabled         boolean not null default true,
  token_hash      text,                              -- sha256 of the pending invite/reset token
  token_kind      text check (token_kind in ('invite','reset')),
  token_expires   timestamptz,
  failed_logins   int not null default 0,
  locked_until    timestamptz,
  created_at      timestamptz not null default now(),
  signed_up_at    timestamptz,
  last_login_at   timestamptz
);
create index if not exists vm_users_token_hash_idx on public.vm_users (token_hash);
alter table public.vm_users enable row level security;

-- 2026-09-20: free trials. plan='trial' -> access ends at trial_ends_at. The clock starts when the
-- person redeems the sign-up link (trial_days is copied into trial_ends_at at that moment).
alter table public.vm_users add column if not exists plan text not null default 'full' check (plan in ('full','trial'));
alter table public.vm_users add column if not exists trial_days int;
alter table public.vm_users add column if not exists trial_ends_at timestamptz;
