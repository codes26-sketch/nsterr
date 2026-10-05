-- NSTER database schema for Supabase Postgres.
-- Run this once in the Supabase SQL Editor before the first site deployment.

create extension if not exists pgcrypto;

create table if not exists public.nster_settings (
  id boolean primary key default true check (id = true),
  setup_complete boolean not null default false,
  visitor_salt text,
  visitor_hash text,
  visitor_version integer not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.nster_settings (id, setup_complete)
values (true, false)
on conflict (id) do nothing;

create table if not exists public.nster_owner_accounts (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  display_name text not null,
  role text not null check (role in ('main', 'uploader')),
  password_salt text not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  constraint nster_owner_username_format check (username = lower(username) and char_length(username) between 3 and 32)
);

create unique index if not exists nster_owner_username_unique
  on public.nster_owner_accounts (username);

create table if not exists public.nster_questions (
  id uuid primary key default gen_random_uuid(),
  question varchar(160) not null check (char_length(trim(question)) between 3 and 160),
  answer text not null check (char_length(trim(answer)) between 2 and 4000),
  code varchar(3000) not null default '',
  language varchar(24) not null default '',
  created_by uuid references public.nster_owner_accounts(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists nster_questions_created_at_idx
  on public.nster_questions (created_at desc);

create table if not exists public.nster_rate_limits (
  key_hash text primary key,
  window_started timestamptz not null,
  attempts integer not null default 0
);

create index if not exists nster_rate_limits_window_idx
  on public.nster_rate_limits (window_started);

alter table public.nster_settings enable row level security;
alter table public.nster_owner_accounts enable row level security;
alter table public.nster_questions enable row level security;
alter table public.nster_rate_limits enable row level security;

-- All database access goes through Netlify Functions. No browser role can read
-- password hashes, visitor settings, owner accounts, or unpublished content.
revoke all on public.nster_settings from public, anon, authenticated;
revoke all on public.nster_owner_accounts from public, anon, authenticated;
revoke all on public.nster_questions from public, anon, authenticated;
revoke all on public.nster_rate_limits from public, anon, authenticated;
grant all on public.nster_settings to service_role;
grant all on public.nster_owner_accounts to service_role;
grant all on public.nster_questions to service_role;
grant all on public.nster_rate_limits to service_role;

create or replace function public.nster_take_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_attempts integer;
begin
  if p_limit < 1 or p_window_seconds < 1 or length(p_key) <> 64 then
    raise exception 'Invalid rate limit parameters';
  end if;

  insert into public.nster_rate_limits as bucket (key_hash, window_started, attempts)
  values (p_key, now(), 1)
  on conflict (key_hash) do update
  set attempts = case
        when bucket.window_started <= now() - make_interval(secs => p_window_seconds) then 1
        else bucket.attempts + 1
      end,
      window_started = case
        when bucket.window_started <= now() - make_interval(secs => p_window_seconds) then now()
        else bucket.window_started
      end
  returning attempts into current_attempts;

  -- Reclaim stale keyed-IP buckets occasionally so this table stays bounded.
  if random() < 0.01 then
    delete from public.nster_rate_limits
    where window_started < now() - interval '7 days';
  end if;

  return current_attempts <= p_limit;
end;
$$;

revoke all on function public.nster_take_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.nster_take_rate_limit(text, integer, integer) to service_role;
