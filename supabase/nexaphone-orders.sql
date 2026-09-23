-- Nexa Pro phone store orders (order requests until JHPS checkout is wired)
create table if not exists public.nexaphone_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  status text not null default 'requested', -- requested | invoiced | paid | building | shipped | delivered | cancelled
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  company text,
  shipping_address jsonb not null,
  items jsonb not null,            -- [{slug,name,ram,storage,color,addons[],qty,unit_price,line_total}]
  subtotal numeric(10,2) not null,
  shipping numeric(10,2) not null default 0,
  total_before_tax numeric(10,2) not null,
  notes text,
  jhps_invoice_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.nexaphone_orders enable row level security;
-- no public policies: only the service role (server) reads/writes
create index if not exists nexaphone_orders_created_idx on public.nexaphone_orders (created_at desc);
