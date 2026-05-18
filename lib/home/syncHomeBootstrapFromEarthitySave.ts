import type { Dispatch, SetStateAction } from 'react';

import type { CareDiaryEntry, CreatureMapSpawnsSave, EarthitySave } from '../shared/types';

export type SyncHomeBootstrapFromSaveOps = {
  setDobri: Dispatch<SetStateAction<number>>;
  setTotalDobri: Dispatch<SetStateAction<number>>;
  setXp: Dispatch<SetStateAction<number>>;
  setDeeds: Dispatch<SetStateAction<number>>;
  setCompleted: Dispatch<SetStateAction<number[]>>;
  setOnboarded: Dispatch<SetStateAction<boolean>>;
  setOutdoorDeeds: Dispatch<SetStateAction<number>>;
  setHomeDeeds: Dispatch<SetStateAction<number>>;
  setPetDeeds: Dispatch<SetStateAction<number>>;
  setTestDeeds: Dispatch<SetStateAction<number>>;
  setCareDiary: Dispatch<SetStateAction<CareDiaryEntry[]>>;
  hydrateResourceRespawnUntil: (map: Record<string, number> | undefined | null) => void;
  hydrateCreatureMapSpawns: (snapshot: CreatureMapSpawnsSave) => void;
};

/** DEV reset: syncs save fields into Home bootstrap + map hydrators (streak/date stay on caller after `reloadInventory`, legacy order). */
export function syncHomeBootstrapFromEarthitySave(
  save: EarthitySave,
  ops: SyncHomeBootstrapFromSaveOps
): void {
  ops.setDobri(save.dobri);
  ops.setTotalDobri(save.totalDobri);
  ops.setXp(save.xp);
  ops.setDeeds(save.deeds);
  ops.setCompleted(save.completed);
  ops.setOnboarded(save.onboarded);
  ops.setOutdoorDeeds(save.outdoorDeeds);
  ops.setHomeDeeds(save.homeDeeds);
  ops.setPetDeeds(save.petDeeds);
  ops.setTestDeeds(save.testDeeds);
  ops.setCareDiary(save.careDiary);
  ops.hydrateResourceRespawnUntil(save.resourceRespawnUntil);
  ops.hydrateCreatureMapSpawns(save.creatureMapSpawns);
}
