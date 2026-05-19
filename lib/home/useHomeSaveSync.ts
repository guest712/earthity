import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';

import type { EarthitySave, LanguageCode } from '../shared/types';
import { pushCloudSaveToServer, isCloudPushAllowed } from '../supabase/cloudSave';
import { getSave, patchSave } from '../storage/save.repository';

const AUTOSAVE_DEBOUNCE_MS = 500;

/** Fields written by the home screen debounced autosave. */
export type HomeAutosavePatch = Pick<
  EarthitySave,
  | 'dobri'
  | 'xp'
  | 'deeds'
  | 'completed'
  | 'lang'
  | 'onboarded'
  | 'outdoorDeeds'
  | 'homeDeeds'
  | 'petDeeds'
  | 'totalDobri'
  | 'streak'
  | 'lastOpenDate'
  | 'testDeeds'
  | 'careDiary'
  | 'resources'
  | 'drops'
  | 'resourceRespawnUntil'
  | 'creatureMapSpawns'
>;

export type UseHomeSaveSyncArgs = {
  lang: LanguageCode | null;
  isHydrated: boolean;
  setIsHydrated: Dispatch<SetStateAction<boolean>>;
  accessToken: string | null;
  onBootstrapSave: (save: EarthitySave) => void;
  onFocusRevalidate: (save: EarthitySave) => void;
  /** When `null`, autosave is skipped (e.g. language not chosen yet). */
  autosavePayload: HomeAutosavePatch | null;
};

export function useHomeSaveSync({
  lang,
  isHydrated,
  setIsHydrated,
  accessToken,
  onBootstrapSave,
  onFocusRevalidate,
  autosavePayload,
}: UseHomeSaveSyncArgs): void {
  const autosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadHome = async () => {
      try {
        const save = await getSave();
        if (!cancelled) {
          onBootstrapSave(save);
        }
      } catch (e) {
        console.warn('Home load error', e);
      } finally {
        if (!cancelled) {
          setIsHydrated(true);
        }
      }
    };

    void loadHome();
    return () => {
      cancelled = true;
    };
  }, [onBootstrapSave, setIsHydrated]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const save = await getSave();
          if (!cancelled) {
            onFocusRevalidate(save);
          }
        } catch {
          /* keep current */
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [onFocusRevalidate])
  );

  useEffect(() => {
    if (!accessToken || !lang || !isHydrated || !autosavePayload) {
      return;
    }

    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    autosaveTimeoutRef.current = setTimeout(() => {
      patchSave(autosavePayload)
        .then((next) => {
          if (accessToken && isCloudPushAllowed()) {
            return pushCloudSaveToServer(next);
          }
        })
        .catch((e) => {
          console.warn('Home save error', e);
        });
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [lang, isHydrated, autosavePayload, accessToken]);
}
