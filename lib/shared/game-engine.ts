import { Quest } from './types';
import { getDistance } from './game-utils';
import type { Creature, CreatureGroup, SpawnedCreature, CareDiaryEntry, DropId } from './types';

export const DROP_INFO: Record<DropId, { emoji: string; label: Record<string, string> }> = {
  feather: { emoji: '🪶', label: { ru: 'Пёрышко',  en: 'Feather', de: 'Feder',        uk: 'Пір\'ячко', ar: 'ريشة'      } },
  wool:    { emoji: '🧶', label: { ru: 'Шерсть',   en: 'Wool',    de: 'Wolle',        uk: 'Вовна',     ar: 'صوف'       } },
  pollen:  { emoji: '🌼', label: { ru: 'Пыльца',   en: 'Pollen',  de: 'Pollen',       uk: 'Пилок',     ar: 'حبوب اللقاح' } },
  scale:   { emoji: '🐢', label: { ru: 'Чешуйка',  en: 'Scale',   de: 'Schuppe',      uk: 'Лусочка',   ar: 'قشرة'      } },
  petal:   { emoji: '🌸', label: { ru: 'Лепесток', en: 'Petal',   de: 'Blütenblatt',  uk: 'Пелюстка',  ar: 'بتلة'      } },
  seed:    { emoji: '🌱', label: { ru: 'Семечко',  en: 'Seed',    de: 'Samen',        uk: 'Насінина',  ar: 'بذرة'      } },
};

const GROUP_DROP_MAP: Record<CreatureGroup, DropId> = {
  mammal:       'wool',
  bird:         'feather',
  insect:       'pollen',
  reptile:      'scale',
  flora_flower: 'petal',
  flora_seed:   'seed',
};

const GROUP_DROP_CHANCE: Record<CreatureGroup, number> = {
  mammal:       0.25,
  bird:         0.25,
  insect:       0.30,
  reptile:      0.20,
  flora_flower: 0.20,
  flora_seed:   0.22,
};

export function getCreatureDropId(creature: Creature): DropId | null {
  return GROUP_DROP_MAP[creature.group] ?? null;
}

export function rollCreatureDrop(creature: Creature): DropId | null {
  const chance = GROUP_DROP_CHANCE[creature.group] ?? 0.20;
  if (Math.random() > chance) return null;
  return getCreatureDropId(creature);
}

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
  maxDistance = 150
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
    maxDistance = 150,
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
  totalDobri: number;
  xp: number;
  waterLevel: number;
}) => {
  const { creature, dobri, totalDobri, xp, waterLevel } = params;

  return {
    dobri: dobri + creature.reward,
    totalDobri: totalDobri + creature.reward,
    xp: xp + creature.reward,
    waterLevel:
      creature.type === 'flower'
        ? Math.max(0, waterLevel - 1)
        : waterLevel,
  };
};

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function metersToLatitude(meters: number) {
  return meters / 111320;
}

function metersToLongitude(meters: number, latitude: number) {
  return meters / (111320 * Math.cos((latitude * Math.PI) / 180));
}

export function generateCreatureSpawns(params: {
  baseLatitude: number;
  baseLongitude: number;
  creatureIds: string[];
  count?: number;
  minRadiusMeters?: number;
  maxRadiusMeters?: number;
  lifetimeMs?: number;
  now?: number;
}): SpawnedCreature[] {
  const {
    baseLatitude,
    baseLongitude,
    creatureIds,
    count = 5,
    minRadiusMeters = 80,
    maxRadiusMeters = 280,
    lifetimeMs = 15 * 60 * 1000,
    now = Date.now(),
  } = params;

  

  const result: SpawnedCreature[] = [];

  for (let i = 0; i < count; i++) {
    const radius = randomBetween(minRadiusMeters, maxRadiusMeters);
    const angle = Math.random() * Math.PI * 2;

    const dx = Math.cos(angle) * radius;
    const dy = Math.sin(angle) * radius;

    const latOffset = metersToLatitude(dy);
    const lonOffset = metersToLongitude(dx, baseLatitude);

    const creatureId = creatureIds[i % creatureIds.length];

    result.push({
      spawnId: `${creatureId}_${now}_${i}_${Math.floor(Math.random() * 100000)}`,
      creatureId,
      latitude: baseLatitude + latOffset,
      longitude: baseLongitude + lonOffset,
      spawnedAt: now,
      expiresAt: now + lifetimeMs,
    });
  }

  return result;
}

export function generateCreatureSpawnsSpread(params: {
  baseLatitude: number;
  baseLongitude: number;
  creatureIds: string[];
  existingSpawns?: SpawnedCreature[];
  count?: number;
  minRadiusMeters?: number;
  maxRadiusMeters?: number;
  minGapMeters?: number;
  lifetimeMs?: number;
  now?: number;
  maxAttemptsPerSpawn?: number;
}): SpawnedCreature[] {
  const {
    baseLatitude,
    baseLongitude,
    creatureIds,
    existingSpawns = [],
    count = 5,
    minRadiusMeters = 80,
    maxRadiusMeters = 280,
    minGapMeters = 70,
    lifetimeMs = 15 * 60 * 1000,
    now = Date.now(),
    maxAttemptsPerSpawn = 12,
  } = params;

  const result: SpawnedCreature[] = [];

  for (let i = 0; i < count; i++) {
    let created: SpawnedCreature | null = null;

    for (let attempt = 0; attempt < maxAttemptsPerSpawn; attempt++) {
      const radius = randomBetween(minRadiusMeters, maxRadiusMeters);
      const angle = Math.random() * Math.PI * 2;

      const dx = Math.cos(angle) * radius;
      const dy = Math.sin(angle) * radius;

      const latOffset = metersToLatitude(dy);
      const lonOffset = metersToLongitude(dx, baseLatitude);

      const candidate: SpawnedCreature = {
        spawnId: `${creatureIds[i % creatureIds.length]}_${now}_${i}_${attempt}_${Math.floor(Math.random() * 100000)}`,
        creatureId: creatureIds[(i + attempt) % creatureIds.length],
        latitude: baseLatitude + latOffset,
        longitude: baseLongitude + lonOffset,
        spawnedAt: now,
        expiresAt: now + lifetimeMs,
      };

      const tooCloseToExisting = [...existingSpawns, ...result].some((spawn) => {
        const distance = getDistance(
          candidate.latitude,
          candidate.longitude,
          spawn.latitude,
          spawn.longitude
        );

        return distance < minGapMeters;
      });

      if (!tooCloseToExisting) {
        created = candidate;
        break;
      }
    }

    if (created) {
      result.push(created);
    }
  }

  return result;
}

export function pruneCreatureSpawns(params: {
  spawns: SpawnedCreature[];
  now?: number;
  userLatitude: number;
  userLongitude: number;
  maxDistanceMeters?: number;
}) {
  const {
    spawns,
    now = Date.now(),
    userLatitude,
    userLongitude,
    maxDistanceMeters = 450,
  } = params;

  return spawns.filter((spawn) => {
    if (spawn.expiresAt <= now) return false;

    const distance = getDistance(
      userLatitude,
      userLongitude,
      spawn.latitude,
      spawn.longitude
    );

    return distance <= maxDistanceMeters;
  });
}

export function shouldRefreshCreatureSpawns(params: {
  lastSpawnCenter: { latitude: number; longitude: number } | null;
  currentLatitude: number;
  currentLongitude: number;
  lastRefreshAt: number;
  now?: number;
  refreshDistanceMeters?: number;
  refreshIntervalMs?: number;
}) {
  const {
    lastSpawnCenter,
    currentLatitude,
    currentLongitude,
    lastRefreshAt,
    now = Date.now(),
    refreshDistanceMeters = 180,
    refreshIntervalMs = 5 * 60 * 1000,
  } = params;

  if (!lastSpawnCenter) return true;
  if (now - lastRefreshAt >= refreshIntervalMs) return true;

  const movedDistance = getDistance(
    lastSpawnCenter.latitude,
    lastSpawnCenter.longitude,
    currentLatitude,
    currentLongitude
  );

  return movedDistance >= refreshDistanceMeters;
}

export function registerCreatureSeen(params: {
  diary: CareDiaryEntry[];
  creatureId: string;
  now?: number;
}): CareDiaryEntry[] {
  const { diary, creatureId, now = Date.now() } = params;

  const existing = diary.find((entry) => entry.creatureId === creatureId);

  if (!existing) {
    return [
      ...diary,
      {
        creatureId,
        firstSeenAt: now,
        lastSeenAt: now,
        interactions: 0,
      },
    ];
  }

  return diary.map((entry) =>
    entry.creatureId === creatureId
      ? {
          ...entry,
          lastSeenAt: now,
        }
      : entry
  );
}

export function registerCreatureCared(params: {
  diary: CareDiaryEntry[];
  creatureId: string;
  now?: number;
}): CareDiaryEntry[] {
  const { diary, creatureId, now = Date.now() } = params;

  const existing = diary.find((entry) => entry.creatureId === creatureId);

  if (!existing) {
    return [
      ...diary,
      {
        creatureId,
        firstSeenAt: now,
        lastSeenAt: now,
        interactions: 1,
        firstCaredAt: now,
        lastCaredAt: now,
      },
    ];
  }

  return diary.map((entry) =>
    entry.creatureId === creatureId
      ? {
          ...entry,
          lastSeenAt: now,
          interactions: entry.interactions + 1,
          firstCaredAt: entry.firstCaredAt ?? now,
          lastCaredAt: now,
        }
      : entry
  );
}