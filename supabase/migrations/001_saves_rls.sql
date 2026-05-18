-- Earthity: cloud save (one JSONB row per auth user).
-- Apply via Supabase SQL Editor or: supabase db push (when CLI linked).
-- Client: lib/supabase/cloudSave.ts (RLS + anon key only).

create table if not exists public.saves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  save_version int not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.saves enable row level security;

drop policy if exists "saves_select_own" on public.saves;
create policy "saves_select_own"
  on public.saves
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "saves_insert_own" on public.saves;
create policy "saves_insert_own"
  on public.saves
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "saves_update_own" on public.saves;
create policy "saves_update_own"
  on public.saves
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.touch_saves_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists saves_touch_updated_at on public.saves;
create trigger saves_touch_updated_at
  before update on public.saves
  for each row
  execute function public.touch_saves_updated_at();
