-- TTL for active cleanup markers (client sets expires_at on insert; 7 days default).

alter table public.cleanup_spots
  add column if not exists expires_at timestamptz;

create index if not exists cleanup_spots_active_expires_idx
  on public.cleanup_spots (user_id, expires_at)
  where status in ('open', 'in_raid');
