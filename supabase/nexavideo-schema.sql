-- Nexa Video (private Android media-center app for the owner + friends). Service-role only (RLS on, no policies).
-- Invite-only accounts, same shape as vm_users: an admin "invite link" creates a row, the invitee picks
-- username + password, then signs in on the download page and in the app.
create table if not exists public.nexavideo_users (
  id              uuid primary key default gen_random_uuid(),
  label           text not null default '',          -- admin's note: who this is for
  username        text unique,                       -- null until the invite is redeemed
  password_hash   text,                              -- scrypt: salt:hash (hex)
  enabled         boolean not null default true,
  token_hash      text,                              -- sha256 of the pending invite/reset token
  token_kind      text check (token_kind in ('invite','reset')),
  token_expires   timestamptz,
  failed_logins   int not null default 0,
  locked_until    timestamptz,
  created_at      timestamptz not null default now(),
  signed_up_at    timestamptz,
  last_login_at   timestamptz,
  last_seen_at    timestamptz,                       -- the app checks in on launch
  app_version     text,
  device          text,
  downloads       int not null default 0
);
create index if not exists nexavideo_users_token_hash_idx on public.nexavideo_users (token_hash);
alter table public.nexavideo_users enable row level security;

-- Published app builds. The newest row is what the download page and in-app updates hand out.
create table if not exists public.nexavideo_releases (
  id              uuid primary key default gen_random_uuid(),
  version_code    int not null unique,
  version_name    text not null,
  notes           text not null default '',
  storage_path    text not null,                     -- object in the private 'nexavideo' bucket
  size_bytes      bigint,
  created_at      timestamptz not null default now()
);
alter table public.nexavideo_releases enable row level security;

-- 2026-10-31: free trials (same model as vm_users). plan='trial' -> access ends at trial_ends_at; the clock starts
-- when the invite is redeemed (trial_days is copied into trial_ends_at then). Expired = signed out, data kept.
alter table public.nexavideo_users add column if not exists plan text not null default 'full' check (plan in ('full','trial'));
alter table public.nexavideo_users add column if not exists trial_days int;
alter table public.nexavideo_users add column if not exists trial_ends_at timestamptz;

-- 2026-10-31: "Request access" from the download page. The person picks username + password up front; the admin
-- approves (trial or permanent) and a nexavideo_users row is created from it — no invite link needed.
create table if not exists public.nexavideo_requests (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  contact         text not null,                     -- phone or email, as typed
  email           text,                              -- set when contact looks like an email (approval notice)
  note            text not null default '',
  username        text not null,
  password_hash   text not null,
  status          text not null default 'pending' check (status in ('pending','approved','dismissed')),
  ip_hash         text,
  user_id         uuid,
  created_at      timestamptz not null default now(),
  decided_at      timestamptz
);
create index if not exists nexavideo_requests_status_idx on public.nexavideo_requests (status, created_at desc);
alter table public.nexavideo_requests enable row level security;

-- 2026-10-31: switches. key 'downloads' = {"paused": bool, "allow": [usernames that can still download while paused]}
create table if not exists public.nexavideo_settings (
  key         text primary key,
  value       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);
alter table public.nexavideo_settings enable row level security;
insert into public.nexavideo_settings (key, value) values ('downloads', '{"paused": true, "allow": ["admin", "screenshots"]}')
  on conflict (key) do update set value = excluded.value, updated_at = now();
