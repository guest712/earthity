import { useCallback, useEffect, useState } from 'react';

import { CREATURES } from '../features/creatures/creature.constants';
import {
  generateCreatureSpawnsSpread,
  pruneCreatureSpawns,
  shouldRefreshCreatureSpawns,
} from '../lib/shared/game-engine';
import type { CreatureMapSpawnsSave, SpawnedCreature } from '../lib/shared/types';

const TARGET_SPAWN_COUNT = 5;

export function useCreatureMapSpawns(location: { latitude: number; longitude: number } | null) {
  const [activeSpawns, setActiveSpawns] = useState<SpawnedCreature[]>([]);
  const [lastSpawnCenter, setLastSpawnCenter] = useState<{ latitude: number; longitude: number } | null>(
    null
  );
  const [lastSpawnRefreshAt, setLastSpawnRefreshAt] = useState(0);

  useEffect(() => {
    if (!location) return;

    const now = Date.now();
    let shouldUpdateSpawnMeta = false;

    setActiveSpawns((prev) => {
      const cleaned = pruneCreatureSpawns({
        spawns: prev,
        userLatitude: location.latitude,
        userLongitude: location.longitude,
        now,
      });

      const needsRefresh = shouldRefreshCreatureSpawns({
        lastSpawnCenter,
        currentLatitude: location.latitude,
        currentLongitude: location.longitude,
        lastRefreshAt: lastSpawnRefreshAt,
        now,
      });

      const missingCount = Math.max(0, TARGET_SPAWN_COUNT - cleaned.length);

      if (!needsRefresh && missingCount === 0) {
        return cleaned;
      }

      const newSpawns =
        missingCount > 0
          ? generateCreatureSpawnsSpread({
              baseLatitude: location.latitude,
              baseLongitude: location.longitude,
              creatureIds: CREATURES.map((c) => c.id),
              existingSpawns: cleaned,
              count: missingCount,
              minGapMeters: 70,
              now,
            })
          : [];

      if (needsRefresh) {
        shouldUpdateSpawnMeta = true;
      }

      return [...cleaned, ...newSpawns];
    });

    if (shouldUpdateSpawnMeta) {
      setLastSpawnCenter({
        latitude: location.latitude,
        longitude: location.longitude,
      });
      setLastSpawnRefreshAt(now);
    }
  }, [location, lastSpawnCenter, lastSpawnRefreshAt]);

  const hydrateCreatureMapSpawns = useCallback((snapshot: CreatureMapSpawnsSave) => {
    setActiveSpawns(snapshot.activeSpawns);
    setLastSpawnCenter(snapshot.lastSpawnCenter);
    setLastSpawnRefreshAt(snapshot.lastSpawnRefreshAt);
  }, []);

  return {
    activeSpawns,
    setActiveSpawns,
    lastSpawnCenter,
    lastSpawnRefreshAt,
    hydrateCreatureMapSpawns,
  };
}
