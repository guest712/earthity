import { useCallback, useMemo, type Dispatch, type SetStateAction } from 'react';

import type { HomeMapLayerProps } from '../../components/home/HomeMapLayer';
import { registerCreatureSeen } from '../shared/game-engine';
import type { CareDiaryEntry, Creature, LanguageCode, Quest, SpawnedCreature } from '../shared/types';
import type { LocaleStrings } from '../i18n/locale-strings';

type UseHomeMapLayerPropsArgs = {
  t: LocaleStrings;
  lang: LanguageCode;
  location: HomeMapLayerProps['location'];
  filteredQuests: Quest[];
  activeSpawns: SpawnedCreature[];
  selectedSpawn: SpawnedCreature | null;
  devBypassDistance: boolean;
  resourcesWater: number;
  feedCount: number;
  plastic: number;
  glass: number;
  paper: number;
  bio: number;
  isResourceSpotActive: HomeMapLayerProps['isResourceSpotActive'];
  despawnResourceSpot: HomeMapLayerProps['despawnResourceSpot'];
  isActionCoolingDown: HomeMapLayerProps['isActionCoolingDown'];
  incrementDaily: HomeMapLayerProps['incrementDaily'];
  refillWaterInv: HomeMapLayerProps['refillWaterInv'];
  addFeedInv: HomeMapLayerProps['addFeedInv'];
  addTrashInv: HomeMapLayerProps['addTrashInv'];
  onQuestMarkerPress: HomeMapLayerProps['onQuestMarkerPress'];
  setSelectedCreature: Dispatch<SetStateAction<Creature | null>>;
  setSelectedSpawn: Dispatch<SetStateAction<SpawnedCreature | null>>;
  setCareDiary: Dispatch<SetStateAction<CareDiaryEntry[]>>;
};

export function useHomeMapLayerProps({
  t,
  lang,
  location,
  filteredQuests,
  activeSpawns,
  selectedSpawn,
  devBypassDistance,
  resourcesWater,
  feedCount,
  plastic,
  glass,
  paper,
  bio,
  isResourceSpotActive,
  despawnResourceSpot,
  isActionCoolingDown,
  incrementDaily,
  refillWaterInv,
  addFeedInv,
  addTrashInv,
  onQuestMarkerPress,
  setSelectedCreature,
  setSelectedSpawn,
  setCareDiary,
}: UseHomeMapLayerPropsArgs): HomeMapLayerProps {
  const onCreatureSpawnPress = useCallback(
    (creature: Creature, spawn: SpawnedCreature) => {
      setSelectedCreature(creature);
      setSelectedSpawn(spawn);
      setCareDiary((prev) =>
        registerCreatureSeen({
          diary: prev,
          creatureId: creature.id,
        })
      );
    },
    [setCareDiary, setSelectedCreature, setSelectedSpawn]
  );

  return useMemo(
    () => ({
      t,
      lang,
      location,
      filteredQuests,
      activeSpawns,
      selectedSpawn,
      devBypassDistance,
      resourcesWater,
      feedCount,
      plastic,
      glass,
      paper,
      bio,
      isResourceSpotActive,
      despawnResourceSpot,
      isActionCoolingDown,
      incrementDaily,
      refillWaterInv,
      addFeedInv,
      addTrashInv,
      onQuestMarkerPress,
      onCreatureSpawnPress,
    }),
    [
      t,
      lang,
      location,
      filteredQuests,
      activeSpawns,
      selectedSpawn,
      devBypassDistance,
      resourcesWater,
      feedCount,
      plastic,
      glass,
      paper,
      bio,
      isResourceSpotActive,
      despawnResourceSpot,
      isActionCoolingDown,
      incrementDaily,
      refillWaterInv,
      addFeedInv,
      addTrashInv,
      onQuestMarkerPress,
      onCreatureSpawnPress,
    ]
  );
}
