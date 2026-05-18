import { useCallback, type Dispatch, type SetStateAction } from 'react';

import { scheduleCreatureNotification } from '../notifications';
import {
  canInteractWithCreature,
  getCreatureRewardResult,
  registerCreatureCared,
  rollCreatureDrop,
} from '../shared/game-engine';
import { getDistance } from '../shared/game-utils';
import type { LocaleStrings } from '../i18n/locale-strings';
import type {
  CareDiaryEntry,
  Creature,
  DailyQuestKind,
  DropId,
  LanguageCode,
  SpawnedCreature,
} from '../shared/types';

import type { ActionCooldownKind } from './useActionCooldown';

type UseHomeCreatureCareActionsArgs = {
  selectedCreature: Creature | null;
  selectedSpawn: SpawnedCreature | null;
  location: { latitude: number; longitude: number } | null;
  devBypassDistance: boolean;
  resourcesWater: number;
  feedCount: number;
  creatureCooldowns: Record<string, number>;
  isFeeding: boolean;
  isActionCoolingDown: (kind: ActionCooldownKind) => boolean;
  dobri: number;
  totalDobri: number;
  xp: number;
  lang: LanguageCode;
  t: LocaleStrings;
  consumeWater: (n: number) => void;
  consumeFeed: (n: number) => void;
  incrementDaily: (kind: DailyQuestKind, amount?: number) => void;
  animateReward: () => void;
  playRewardSound: () => void;
  triggerDropToast: (dropId: DropId, lang: string) => void;
  addDrop: (id: DropId, amount: number) => void;
  startFeeding: (onComplete: () => void) => void;
  setDobri: Dispatch<SetStateAction<number>>;
  setTotalDobri: Dispatch<SetStateAction<number>>;
  setXp: Dispatch<SetStateAction<number>>;
  setCreatureCooldowns: Dispatch<SetStateAction<Record<string, number>>>;
  setCareDiary: Dispatch<SetStateAction<CareDiaryEntry[]>>;
  setActiveSpawns: Dispatch<SetStateAction<SpawnedCreature[]>>;
  setSelectedCreature: Dispatch<SetStateAction<Creature | null>>;
  setSelectedSpawn: Dispatch<SetStateAction<SpawnedCreature | null>>;
};

export function useHomeCreatureCareActions({
  selectedCreature,
  selectedSpawn,
  location,
  devBypassDistance,
  resourcesWater,
  feedCount,
  creatureCooldowns,
  isFeeding,
  isActionCoolingDown,
  dobri,
  totalDobri,
  xp,
  lang,
  t,
  consumeWater,
  consumeFeed,
  incrementDaily,
  animateReward,
  playRewardSound,
  triggerDropToast,
  addDrop,
  startFeeding,
  setDobri,
  setTotalDobri,
  setXp,
  setCreatureCooldowns,
  setCareDiary,
  setActiveSpawns,
  setSelectedCreature,
  setSelectedSpawn,
}: UseHomeCreatureCareActionsArgs) {
  const onPressCreatureAction = useCallback(() => {
    if (isActionCoolingDown('creature')) return;
    const now = Date.now();
    if (!selectedCreature) return;
    const lastTime = creatureCooldowns[selectedCreature.id] || 0;

    if (!selectedSpawn) return;

    const dist = location
      ? getDistance(
          location.latitude,
          location.longitude,
          selectedSpawn.latitude,
          selectedSpawn.longitude
        )
      : 999;

    const effectiveDist = devBypassDistance ? 0 : dist;

    const interaction = canInteractWithCreature({
      creature: selectedCreature,
      distance: effectiveDist,
      waterLevel: resourcesWater,
      lastInteractionTime: lastTime,
      now,
    });

    if (!interaction.ok) {
      if (interaction.reason === 'too_far') {
        alert(t.alertTooFar);
      } else if (interaction.reason === 'no_water') {
        alert(t.alertNoWater);
      } else if (interaction.reason === 'cooldown' && !isFeeding) {
        setSelectedCreature(null);
      }
      return;
    }

    if (selectedCreature.type === 'animal' && feedCount <= 0) {
      alert(t.alertNoFeed);
      return;
    }

    if (isFeeding) return;

    const creature = selectedCreature;
    const spawn = selectedSpawn;

    startFeeding(() => {
      const rewardResult = getCreatureRewardResult({
        creature,
        dobri,
        totalDobri,
        xp,
        waterLevel: resourcesWater,
      });

      setDobri(rewardResult.dobri);
      setTotalDobri(rewardResult.totalDobri);
      setXp(rewardResult.xp);
      if (creature.type === 'flower') {
        consumeWater(1);
        incrementDaily('water_flowers', 1);
      } else if (creature.type === 'animal') {
        consumeFeed(1);
        incrementDaily('feed_animals', 1);
      }

      setCreatureCooldowns((p) => ({
        ...p,
        [creature.id]: Date.now(),
      }));

      animateReward();
      playRewardSound();
      scheduleCreatureNotification(creature, lang);

      setCareDiary((prev) =>
        registerCreatureCared({
          diary: prev,
          creatureId: creature.id,
        })
      );

      setActiveSpawns((prev) => prev.filter((item) => item.spawnId !== spawn.spawnId));

      setSelectedCreature(null);
      setSelectedSpawn(null);

      const droppedId = rollCreatureDrop(creature);
      if (droppedId) {
        addDrop(droppedId, 1);
        triggerDropToast(droppedId, lang);
      }
    });
  }, [
    selectedCreature,
    selectedSpawn,
    location,
    devBypassDistance,
    resourcesWater,
    feedCount,
    creatureCooldowns,
    isFeeding,
    isActionCoolingDown,
    dobri,
    totalDobri,
    xp,
    lang,
    t,
    consumeWater,
    consumeFeed,
    incrementDaily,
    animateReward,
    playRewardSound,
    triggerDropToast,
    addDrop,
    startFeeding,
    setDobri,
    setTotalDobri,
    setXp,
    setCreatureCooldowns,
    setCareDiary,
    setActiveSpawns,
    setSelectedCreature,
    setSelectedSpawn,
  ]);

  const onCloseCreaturePopup = useCallback(() => {
    setSelectedCreature(null);
    setSelectedSpawn(null);
  }, [setSelectedCreature, setSelectedSpawn]);

  return {
    onPressCreatureAction,
    onCloseCreaturePopup,
  };
}
