import { Quest } from './types';
import type { Creature } from './types';

type CompleteQuestResult = {
  completed: number[];
  dobri: number;
  totalDobri: number;
  xp: number;
  deeds: number;
  outdoorDeeds: number;
  homeDeeds: number;
  petDeeds: number;
  testDeeds: number;
};

export function getStreakBonus(streak: number): number {
  if (streak >= 20) return 1.15;
  if (streak >= 10) return 1.1;
  if (streak >= 5) return 1.05;
  return 1;
}

export function applyQuestCompletion(params: {
  selected: Quest;
  completed: number[];
  dobri: number;
  totalDobri: number;
  xp: number;
  deeds: number;
  outdoorDeeds: number;
  homeDeeds: number;
  petDeeds: number;
  testDeeds: number;
  streak: number;
}): CompleteQuestResult {
  const {
    selected,
    completed,
    dobri,
    totalDobri,
    xp,
    deeds,
    outdoorDeeds,
    homeDeeds,
    petDeeds,
    testDeeds,
    streak,
  } = params;

  const streakBonus = getStreakBonus(streak);
  const gainedXp = Math.round(selected.reward * streakBonus);

  return {
    completed: [...completed, selected.id],
    dobri: dobri + selected.reward,
    totalDobri: totalDobri + selected.reward,
    xp: xp + gainedXp,
    deeds: deeds + 1,
    outdoorDeeds:
      selected.type === 'trash' || selected.type === 'help'
        ? outdoorDeeds + 1
        : outdoorDeeds,
    homeDeeds: selected.type === 'home' ? homeDeeds + 1 : homeDeeds,
    petDeeds: selected.id === 9 ? petDeeds + 1 : petDeeds,
    testDeeds: selected.type === 'test' ? testDeeds + 1 : testDeeds,
  };
}

export function getCreaturePosition(
  baseLatitude: number,
  baseLongitude: number,
  index: number
) {
  return {
    latitude: baseLatitude + Math.sin(index * 1.5) * 0.003,
    longitude: baseLongitude + Math.cos(index * 1.5) * 0.003,
  };
}


export function isWithinInteractionDistance(
  distance: number,
  maxDistance = 300
): boolean {
  return distance <= maxDistance;
}

export type CreatureInteractionCheckResult =
  | { ok: true }
  | { ok: false; reason: 'too_far' | 'no_water' | 'cooldown' };

export const canInteractWithCreature = (params: {
  creature: Creature;
  distance: number;
  waterLevel: number;
  lastInteractionTime: number;
  now: number;
  maxDistance?: number;
}): CreatureInteractionCheckResult => {
  const {
    creature,
    distance,
    waterLevel,
    lastInteractionTime,
    now,
    maxDistance = 300,
  } = params;

  if (distance > maxDistance) {
    return { ok: false, reason: 'too_far' };
  }

  if (creature.type === 'flower' && waterLevel <= 0) {
    return { ok: false, reason: 'no_water' };
  }

  if (now - lastInteractionTime <= creature.cooldown) {
    return { ok: false, reason: 'cooldown' };
  }

  return { ok: true };
};

export const getCreatureRewardResult = (params: {
  creature: Creature;
  dobri: number;
  xp: number;
  waterLevel: number;
}) => {
  const { creature, dobri, xp, waterLevel } = params;

  return {
    dobri: dobri + creature.reward,
    xp: xp + creature.reward,
    waterLevel:
      creature.type === 'flower'
        ? Math.max(0, waterLevel - 1)
        : waterLevel,
  };
};

console.log('game-engine loaded', { canInteractWithCreature, getCreatureRewardResult });