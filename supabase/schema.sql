-- Cupid Call durable credits schema
-- Run this in Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.cupid_users (
  user_id text primary key,
  email text not null,
  total_credits integer not null default 0 check (total_credits >= 0),
  used_credits integer not null default 0 check (used_credits >= 0),
  remaining_credits integer not null default 0 check (remaining_credits >= 0),
  promo_codes_used text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cupid_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.cupid_users(user_id) on delete cascade,
  type text not null check (type in ('promo', 'pack_3')),
  credits integer not null check (credits > 0),
  amount integer not null default 0,
  stripe_session_id text unique,
  created_at timestamptz not null default now()
);

create index if not exists idx_cupid_purchases_user on public.cupid_purchases(user_id);
create index if not exists idx_cupid_purchases_created on public.cupid_purchases(created_at desc);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_cupid_users_updated_at on public.cupid_users;
create trigger trg_cupid_users_updated_at
before update on public.cupid_users
for each row execute function public.set_updated_at();

