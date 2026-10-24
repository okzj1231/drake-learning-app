-- Database setup for Teacher English.
-- Run once in Supabase → SQL Editor. Safe to re-run.
-- Accounts and password hashing (bcrypt) are handled by Supabase Auth (auth.users);
-- these tables only hold chat history and the daily message counter.

-- Conversations and their messages -------------------------------------------

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists conversations_user_updated_idx
  on public.conversations (user_id, updated_at desc);

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_idx
  on public.messages (conversation_id, id);

-- Row-level security: in the browser, a user can only READ their own chats.
-- All writes happen in api/chat.js with the server-only secret key.
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Users read own conversations" on public.conversations;
create policy "Users read own conversations" on public.conversations
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users read own messages" on public.messages;
create policy "Users read own messages" on public.messages
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Daily message limit ---------------------------------------------------------

create table if not exists public.message_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null default current_date,
  count integer not null default 0,
  primary key (user_id, day)
);

-- No policies: not readable or writable from the browser at all
alter table public.message_usage enable row level security;

-- Atomically counts one message for today (UTC). Returns false, without counting,
-- once the user has reached p_limit messages today.
create or replace function public.consume_message_quota(p_user_id uuid, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  insert into public.message_usage as usage (user_id, day, count)
  values (p_user_id, current_date, 1)
  on conflict (user_id, day) do update
    set count = usage.count + 1
    where usage.count < p_limit
  returning usage.count into new_count;

  return new_count is not null;
end;
$$;

-- Only the server (service role) may call it
revoke execute on function public.consume_message_quota(uuid, integer) from public, anon, authenticated;
grant execute on function public.consume_message_quota(uuid, integer) to service_role;
