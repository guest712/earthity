import AsyncStorage from '@react-native-async-storage/async-storage';

import type { EarthitySave } from '../shared/types';
import {
  clearLocalGameSave,
  loadSave,
  readLocalModifiedAt,
  setLocalModifiedAt,
  updateSave,
} from '../storage/storage';
import { getSupabase, isSupabaseConfigured } from './client';

const LAST_SYNC_USER_ID_KEY = 'earthity_cloud_sync_user_id';

type CloudSaveRow = {
  data: EarthitySave;
  updated_at: string;
};

/** Blocks autosave push until login reconcile finishes. */
let cloudReconcileDone = false;

const reconcileListeners = new Set<() => void>();

export function onCloudSaveReconciled(listener: () => void): () => void {
  reconcileListeners.add(listener);
  return () => {
    reconcileListeners.delete(listener);
  };
}

function notifyCloudSaveReconciled(): void {
  for (const listener of reconcileListeners) {
    listener();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function resetCloudSyncSession(): void {
  cloudReconcileDone = false;
}

async function readLastSyncUserId(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(LAST_SYNC_USER_ID_KEY);
    return raw && raw.length > 0 ? raw : null;
  } catch {
    return null;
  }
}

async function setLastSyncUserId(userId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_SYNC_USER_ID_KEY, userId);
  } catch {
    /* noop */
  }
}

/** Clears which Supabase user last completed cloud reconcile (call on sign-out). */
export async function clearCloudSyncUserBinding(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LAST_SYNC_USER_ID_KEY);
  } catch {
    /* noop */
  }
}

export function isCloudPushAllowed(): boolean {
  return cloudReconcileDone;
}

export function saveHasProgress(save: EarthitySave): boolean {
  return (
    save.onboarded ||
    save.dobri > 0 ||
    save.xp > 0 ||
    save.deeds > 0 ||
    save.completed.length > 0 ||
    save.totalDobri > 0 ||
    (save.careDiary?.length ?? 0) > 0
  );
}

async function getAuthedUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = getSupabase();
  for (let attempt = 0; attempt < 4; attempt++) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user?.id) return session.user.id;

    if (attempt < 3) await sleep(120 * (attempt + 1));
  }

  if (__DEV__) console.warn('[cloudSave] no session user after retries');
  return null;
}

export async function fetchCloudSaveRow(): Promise<CloudSaveRow | null> {
  const userId = await getAuthedUserId();
  if (!userId) return null;

  const { data, error } = await getSupabase()
    .from('saves')
    .select('data, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    if (__DEV__) console.warn('[cloudSave] fetch failed', error.message);
    return null;
  }

  if (!data || data.data == null || typeof data.updated_at !== 'string') {
    if (__DEV__) console.log('[cloudSave] fetch: no row yet');
    return null;
  }

  return { data: data.data as EarthitySave, updated_at: data.updated_at };
}

async function applyCloudSave(cloud: CloudSaveRow): Promise<EarthitySave> {
  const cloudTime = Date.parse(cloud.updated_at);
  await updateSave(() => cloud.data);
  if (Number.isFinite(cloudTime)) {
    await setLocalModifiedAt(cloudTime);
  } else {
    await setLocalModifiedAt(Date.now());
  }
  return loadSave();
}

async function upsertCloudSaveRow(save: EarthitySave): Promise<void> {
  const localModifiedAt = await readLocalModifiedAt();
  if (localModifiedAt <= 0) {
    if (__DEV__) console.log('[cloudSave] push skipped: no local writes yet');
    return;
  }

  const existingCloud = await fetchCloudSaveRow();
  if (
    existingCloud &&
    saveHasProgress(existingCloud.data) &&
    !saveHasProgress(save)
  ) {
    if (__DEV__) {
      console.warn('[cloudSave] push skipped: would overwrite cloud progress with empty save');
    }
    return;
  }

  const userId = await getAuthedUserId();
  if (!userId) return;

  const { data, error } = await getSupabase()
    .from('saves')
    .upsert(
      {
        user_id: userId,
        data: save,
        save_version: save.saveVersion,
      },
      { onConflict: 'user_id' }
    )
    .select('updated_at')
    .single();

  if (error) {
    if (__DEV__) console.warn('[cloudSave] push failed', error.message);
    return;
  }

  if (__DEV__) console.log('[cloudSave] push ok');

  if (data?.updated_at) {
    const cloudTime = Date.parse(String(data.updated_at));
    if (Number.isFinite(cloudTime)) {
      await setLocalModifiedAt(cloudTime);
    }
  }
}

export async function pushCloudSaveToServer(save: EarthitySave): Promise<void> {
  if (!cloudReconcileDone) {
    if (__DEV__) console.log('[cloudSave] push skipped: reconcile not done');
    return;
  }
  await upsertCloudSaveRow(save);
}

function logPulledCloud(reason: string, merged: EarthitySave, extra?: Record<string, unknown>): void {
  if (!__DEV__) return;
  console.log(`[cloudSave] reconcile: pulled cloud (${reason})`, {
    dobri: merged.dobri,
    onboarded: merged.onboarded,
    ...extra,
  });
}

/**
 * After login: pull cloud when local has no progress but cloud does (ignores timestamps).
 * Otherwise pick the newer side by updated_at vs localModifiedAt.
 */
export async function reconcileCloudSave(): Promise<EarthitySave> {
  cloudReconcileDone = false;

  const userId = await getAuthedUserId();
  if (!userId) {
    cloudReconcileDone = true;
    notifyCloudSaveReconciled();
    return loadSave();
  }

  const lastUserId = await readLastSyncUserId();
  if (lastUserId && lastUserId !== userId) {
    await clearLocalGameSave();
    if (__DEV__) {
      console.log('[cloudSave] reconcile: cleared local (different user)', {
        lastUserId,
        userId,
      });
    }
  }

  try {
    const local = await loadSave();
    const localModifiedAt = await readLocalModifiedAt();
    const localHasProgress = saveHasProgress(local);

    const cloud = await fetchCloudSaveRow();

    if (!cloud) {
      if (localModifiedAt > 0 && localHasProgress) {
        await upsertCloudSaveRow(local);
      }
      if (__DEV__) console.log('[cloudSave] reconcile: no cloud row, kept local');
      return local;
    }

    const cloudHasProgress = saveHasProgress(cloud.data);
    const cloudTime = Date.parse(cloud.updated_at);

    if (cloudHasProgress && !localHasProgress) {
      const merged = await applyCloudSave(cloud);
      logPulledCloud('local empty', merged, { localModifiedAt, cloudTime });
      return merged;
    }

    if (!cloudHasProgress && localHasProgress) {
      await upsertCloudSaveRow(local);
      if (__DEV__) console.log('[cloudSave] reconcile: pushed local (cloud empty)');
      return local;
    }

    if (!cloudHasProgress && !localHasProgress) {
      if (__DEV__) console.log('[cloudSave] reconcile: both empty, kept local');
      return local;
    }

    if (!Number.isFinite(cloudTime)) {
      if (__DEV__) console.warn('[cloudSave] reconcile: bad cloud timestamp');
      return local;
    }

    if (cloudTime > localModifiedAt) {
      const merged = await applyCloudSave(cloud);
      logPulledCloud('newer', merged, { localModifiedAt, cloudTime });
      return merged;
    }

    if (localModifiedAt > cloudTime) {
      await upsertCloudSaveRow(local);
      if (__DEV__) console.log('[cloudSave] reconcile: pushed local (newer)');
      return local;
    }

    if (__DEV__) {
      console.log('[cloudSave] reconcile: same revision, kept local', {
        localModifiedAt,
        cloudTime,
      });
    }
    return local;
  } finally {
    await setLastSyncUserId(userId);
    cloudReconcileDone = true;
    notifyCloudSaveReconciled();
  }
}
