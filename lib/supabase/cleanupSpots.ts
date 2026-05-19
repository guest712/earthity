import type { Region } from 'react-native-maps';

import {
  CLEANUP_SPOT_MAX_ACTIVE_PER_USER,
  CLEANUP_SPOT_TTL_MS,
} from '../../features/cleanupSpots/cleanupSpot.constants';
import type {
  CleanupSpot,
  CleanupSpotMapBounds,
  CreateCleanupSpotErrorCode,
} from '../../features/cleanupSpots/cleanupSpot.types';
import { getSupabase, isSupabaseConfigured } from './client';

type CleanupSpotRow = {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  kind: 'trash';
  status: CleanupSpot['status'];
  note: string | null;
  created_at: string;
  expires_at: string | null;
  cleaned_at: string | null;
  cleaned_by: string | null;
};

function mapRow(row: CleanupSpotRow): CleanupSpot {
  return {
    id: row.id,
    userId: row.user_id,
    latitude: row.latitude,
    longitude: row.longitude,
    kind: row.kind,
    status: row.status,
    note: row.note,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    cleanedAt: row.cleaned_at,
    cleanedBy: row.cleaned_by,
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

function defaultExpiresAtIso(): string {
  return new Date(Date.now() + CLEANUP_SPOT_TTL_MS).toISOString();
}

/** Active = open/in_raid and not past expires_at (null expires_at counts as active for legacy rows). */
function isSpotActive(row: { status: string; expires_at: string | null }): boolean {
  if (row.status !== 'open' && row.status !== 'in_raid') return false;
  if (!row.expires_at) return true;
  return Date.parse(row.expires_at) > Date.now();
}

const SPOT_SELECT =
  'id, user_id, latitude, longitude, kind, status, note, created_at, expires_at, cleaned_at, cleaned_by';

export function regionToCleanupBounds(region: Region): CleanupSpotMapBounds {
  const halfLat = region.latitudeDelta / 2;
  const halfLng = region.longitudeDelta / 2;
  return {
    minLat: region.latitude - halfLat,
    maxLat: region.latitude + halfLat,
    minLng: region.longitude - halfLng,
    maxLng: region.longitude + halfLng,
  };
}

export async function getCurrentAuthUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const {
    data: { user },
    error,
  } = await getSupabase().auth.getUser();
  if (error || !user?.id) return null;
  return user.id;
}

export async function countActiveCleanupSpotsForUser(userId: string): Promise<number> {
  if (!isSupabaseConfigured()) return 0;

  const now = nowIso();
  const { data, error } = await getSupabase()
    .from('cleanup_spots')
    .select('id, status, expires_at')
    .eq('user_id', userId)
    .in('status', ['open', 'in_raid']);

  if (error) {
    if (__DEV__) console.warn('[cleanupSpots] count active failed', error.message);
    return CLEANUP_SPOT_MAX_ACTIVE_PER_USER;
  }

  return (data ?? []).filter((row) => isSpotActive(row as { status: string; expires_at: string | null }))
    .length;
}

export async function fetchCleanupSpotsInBounds(
  bounds: CleanupSpotMapBounds
): Promise<CleanupSpot[]> {
  if (!isSupabaseConfigured()) return [];

  const now = nowIso();
  const { data, error } = await getSupabase()
    .from('cleanup_spots')
    .select(SPOT_SELECT)
    .in('status', ['open', 'in_raid'])
    .gte('latitude', bounds.minLat)
    .lte('latitude', bounds.maxLat)
    .gte('longitude', bounds.minLng)
    .lte('longitude', bounds.maxLng)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    if (__DEV__) console.warn('[cleanupSpots] fetch failed', error.message);
    return [];
  }

  return (data as CleanupSpotRow[] | null)?.map(mapRow) ?? [];
}

export async function createCleanupSpotAt(
  latitude: number,
  longitude: number,
  note?: string
): Promise<{
  spot: CleanupSpot | null;
  error: string | null;
  errorCode: CreateCleanupSpotErrorCode | null;
}> {
  if (!isSupabaseConfigured()) {
    return { spot: null, error: 'missing_supabase', errorCode: 'missing_supabase' };
  }

  const userId = await getCurrentAuthUserId();
  if (!userId) {
    return { spot: null, error: 'not_authenticated', errorCode: 'not_authenticated' };
  }

  const activeCount = await countActiveCleanupSpotsForUser(userId);
  if (activeCount >= CLEANUP_SPOT_MAX_ACTIVE_PER_USER) {
    return { spot: null, error: 'active_limit', errorCode: 'active_limit' };
  }

  const expiresAt = defaultExpiresAtIso();
  const { data, error } = await getSupabase()
    .from('cleanup_spots')
    .insert({
      user_id: userId,
      latitude,
      longitude,
      note: note?.trim() || null,
      expires_at: expiresAt,
    })
    .select(SPOT_SELECT)
    .single();

  if (error) {
    if (__DEV__) console.warn('[cleanupSpots] insert failed', error.message);
    return { spot: null, error: error.message, errorCode: 'unknown' };
  }

  return { spot: mapRow(data as CleanupSpotRow), error: null, errorCode: null };
}

export async function markCleanupSpotCleaned(
  spotId: string
): Promise<{ ok: boolean; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: 'missing_supabase' };
  }

  const userId = await getCurrentAuthUserId();
  if (!userId) {
    return { ok: false, error: 'not_authenticated' };
  }

  const { error } = await getSupabase()
    .from('cleanup_spots')
    .update({
      status: 'cleaned',
      cleaned_at: nowIso(),
      cleaned_by: userId,
    })
    .eq('id', spotId)
    .eq('status', 'open');

  if (error) {
    if (__DEV__) console.warn('[cleanupSpots] mark cleaned failed', error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true, error: null };
}

export async function deleteOwnCleanupSpot(spotId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await getSupabase().from('cleanup_spots').delete().eq('id', spotId);

  if (error) {
    if (__DEV__) console.warn('[cleanupSpots] delete failed', error.message);
    return false;
  }

  return true;
}
