-- Fix cleanup «mark cleaned» for other players:
-- UPDATE could succeed (mark_cleaned policy) but SELECT on returned row failed
-- → client error "Could not save marker" while API showed 200.
-- Allow the cleaner to read rows they marked cleaned (and keep existing rules).

drop policy if exists "cleanup_spots_select_active_or_own" on public.cleanup_spots;

create policy "cleanup_spots_select_active_or_own"
  on public.cleanup_spots
  for select
  to authenticated
  using (
    status in ('open', 'in_raid')
    or user_id = auth.uid()
    or cleaned_by = auth.uid()
  );
