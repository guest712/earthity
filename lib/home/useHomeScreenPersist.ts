import { useCallback, useMemo, type Dispatch, type SetStateAction } from 'react';

import { DEFAULT_AVATAR_ID } from '../../features/profile/avatar.constants';

import type { CareDiaryEntry, CreatureMapSpawnsSave, EarthitySave, LanguageCode } from '../shared/types';
import { useHomeSaveSync } from './useHomeSaveSync';
import type { HomeAutosavePatch } from './useHomeSaveSync';

export type HomeScreenBootstrapSetters = {
  setDobri: Dispatch<SetStateAction<number>>;
  setXp: Dispatch<SetStateAction<number>>;
  setDeeds: Dispatch<SetStateAction<number>>;
  setCompleted: Dispatch<SetStateAction<number[]>>;
  setOnboarded: Dispatch<SetStateAction<boolean>>;
  setOutdoorDeeds: Dispatch<SetStateAction<number>>;
  setHomeDeeds: Dispatch<SetStateAction<number>>;
  setPetDeeds: Dispatch<SetStateAction<number>>;
  setTestDeeds: Dispatch<SetStateAction<number>>;
  setTotalDobri: Dispatch<SetStateAction<number>>;
  setCareDiary: Dispatch<SetStateAction<CareDiaryEntry[]>>;
  setAvatar: Dispatch<SetStateAction<string>>;
  setStreak: Dispatch<SetStateAction<number>>;
  setLastOpenDate: Dispatch<SetStateAction<string>>;
};

export type HomeAutosaveSnapshot = Omit<HomeAutosavePatch, 'lang'>;

type UseHomeScreenPersistArgs = {
  lang: LanguageCode | null;
  isHydrated: boolean;
  setIsHydrated: Dispatch<SetStateAction<boolean>>;
  hydrateResourceRespawnUntil: (map: Record<string, number> | undefined | null) => void;
  hydrateCreatureMapSpawns: (snapshot: CreatureMapSpawnsSave) => void;
  bootstrap: HomeScreenBootstrapSetters;
  autosaveSnapshot: HomeAutosaveSnapshot;
};

export function useHomeScreenPersist({
  lang,
  isHydrated,
  setIsHydrated,
  hydrateResourceRespawnUntil,
  hydrateCreatureMapSpawns,
  bootstrap,
  autosaveSnapshot,
}: UseHomeScreenPersistArgs): void {
  const {
    setDobri,
    setXp,
    setDeeds,
    setCompleted,
    setOnboarded,
    setOutdoorDeeds,
    setHomeDeeds,
    setPetDeeds,
    setTestDeeds,
    setTotalDobri,
    setCareDiary,
    setAvatar,
    setStreak,
    setLastOpenDate,
  } = bootstrap;

  const onBootstrapSave = useCallback(
    (save: EarthitySave) => {
      setDobri(save.dobri);
      setXp(save.xp);
      setDeeds(save.deeds);
      setCompleted(save.completed);
      setOnboarded(save.onboarded);
      setOutdoorDeeds(save.outdoorDeeds);
      setHomeDeeds(save.homeDeeds);
      setPetDeeds(save.petDeeds);
      setTestDeeds(save.testDeeds);
      setTotalDobri(save.totalDobri || save.dobri || 0);
      setCareDiary(save.careDiary || []);
      setAvatar(save.avatar || DEFAULT_AVATAR_ID);

      hydrateResourceRespawnUntil(save.resourceRespawnUntil);
      hydrateCreatureMapSpawns(save.creatureMapSpawns);

      const today = new Date().toDateString();
      const last = save.lastOpenDate || '';
      const yesterday = new Date(Date.now() - 86400000).toDateString();

      if (last === today) {
        setStreak(save.streak || 0);
      } else if (last === yesterday) {
        setStreak((save.streak || 0) + 1);
      } else {
        setStreak(1);
      }

      setLastOpenDate(today);
    },
    [
      hydrateCreatureMapSpawns,
      hydrateResourceRespawnUntil,
      setAvatar,
      setCareDiary,
      setCompleted,
      setDeeds,
      setHomeDeeds,
      setLastOpenDate,
      setOnboarded,
      setOutdoorDeeds,
      setPetDeeds,
      setStreak,
      setTestDeeds,
      setTotalDobri,
      setXp,
      setDobri,
    ]
  );

  const onFocusRevalidate = useCallback(
    (save: EarthitySave) => {
      setAvatar(save.avatar || DEFAULT_AVATAR_ID);
      setDobri(save.dobri);
      setTotalDobri(save.totalDobri || save.dobri || 0);
      setXp(save.xp);
    },
    [setAvatar, setDobri, setTotalDobri, setXp]
  );

  const autosavePayload = useMemo(
    (): HomeAutosavePatch | null => (lang ? { ...autosaveSnapshot, lang } : null),
    [lang, autosaveSnapshot]
  );

  useHomeSaveSync({
    lang,
    isHydrated,
    setIsHydrated,
    onBootstrapSave,
    onFocusRevalidate,
    autosavePayload,
  });
}
