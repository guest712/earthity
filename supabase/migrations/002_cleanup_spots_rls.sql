-- Earthity: shared map pins "trash needs cleanup" (visible to all logged-in players).
-- Client: lib/supabase/cleanupSpots.ts

create table if not exists public.cleanup_spots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  kind text not null default 'trash'
    check (kind in ('trash')),
  status text not null default 'open'
    check (status in ('open', 'in_raid', 'cleaned', 'expired')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cleaned_at timestamptz,
  cleaned_by uuid references auth.users (id) on delete set null,
  expires_at timestamptz,
  constraint cleanup_spots_lat_range check (latitude >= -90 and latitude <= 90),
  constraint cleanup_spots_lng_range check (longitude >= -180 and longitude <= 180)
);

create index if not exists cleanup_spots_status_created_idx
  on public.cleanup_spots (status, created_at desc);

create index if not exists cleanup_spots_bbox_idx
  on public.cleanup_spots (latitude, longitude)
  where status in ('open', 'in_raid');

alter table public.cleanup_spots enable row level security;

drop policy if exists "cleanup_spots_select_active_or_own" on public.cleanup_spots;
create policy "cleanup_spots_select_active_or_own"
  on public.cleanup_spots
  for select
  to authenticated
  using (
    status in ('open', 'in_raid')
    or user_id = auth.uid()
  );

drop policy if exists "cleanup_spots_insert_own" on public.cleanup_spots;
create policy "cleanup_spots_insert_own"
  on public.cleanup_spots
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "cleanup_spots_update_own" on public.cleanup_spots;
create policy "cleanup_spots_update_own"
  on public.cleanup_spots
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "cleanup_spots_mark_cleaned" on public.cleanup_spots;
create policy "cleanup_spots_mark_cleaned"
  on public.cleanup_spots
  for update
  to authenticated
  using (status = 'open' and user_id <> auth.uid())
  with check (
    status = 'cleaned'
    and cleaned_by = auth.uid()
    and cleaned_at is not null
  );

drop policy if exists "cleanup_spots_delete_own" on public.cleanup_spots;
create policy "cleanup_spots_delete_own"
  on public.cleanup_spots
  for delete
  to authenticated
  using (user_id = auth.uid());

create or replace function public.touch_cleanup_spots_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists cleanup_spots_touch_updated_at on public.cleanup_spots;
create trigger cleanup_spots_touch_updated_at
  before update on public.cleanup_spots
  for each row
  execute function public.touch_cleanup_spots_updated_at();
