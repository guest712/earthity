import { useCallback, useEffect, useRef, useState } from 'react';

import { RESOURCE_SPOT_RESPAWN_MS } from '../../features/resources/resource.constants';

function normalizeRespawnMap(map: Record<string, number>): Record<string, number> {
  const now = Date.now();
  const next: Record<string, number> = {};
  for (const [id, until] of Object.entries(map)) {
    if (typeof until === 'number' && Number.isFinite(until) && until > now) {
      next[id] = until;
    }
  }
  return next;
}

export function useResourceSpotRespawn() {
  const [resourceRespawnUntil, setResourceRespawnUntil] = useState<Record<string, number>>({});
  const resourceRespawnTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const clearSpotTimer = useCallback((spotId: string) => {
    const t = resourceRespawnTimersRef.current[spotId];
    if (t) clearTimeout(t);
    delete resourceRespawnTimersRef.current[spotId];
  }, []);

  const scheduleSpotClear = useCallback(
    (spotId: string, delayMs: number) => {
      clearSpotTimer(spotId);
      resourceRespawnTimersRef.current[spotId] = setTimeout(() => {
        setResourceRespawnUntil((prev) => {
          if ((prev[spotId] ?? 0) > Date.now()) return prev;
          const next = { ...prev };
          delete next[spotId];
          return next;
        });
        delete resourceRespawnTimersRef.current[spotId];
      }, delayMs);
    },
    [clearSpotTimer]
  );

  const despawnResourceSpot = useCallback(
    (spotId: string, respawnMs = RESOURCE_SPOT_RESPAWN_MS) => {
      const respawnAt = Date.now() + respawnMs;
      setResourceRespawnUntil((prev) => ({ ...prev, [spotId]: respawnAt }));
      scheduleSpotClear(spotId, respawnMs + 100);
    },
    [scheduleSpotClear]
  );

  useEffect(() => {
    return () => {
      Object.values(resourceRespawnTimersRef.current).forEach((timer) => clearTimeout(timer));
      resourceRespawnTimersRef.current = {};
    };
  }, []);

  const hydrateResourceRespawnUntil = useCallback(
    (map: Record<string, number> | undefined | null) => {
      const normalized = normalizeRespawnMap(map ?? {});
      Object.keys(resourceRespawnTimersRef.current).forEach((id) => clearSpotTimer(id));

      setResourceRespawnUntil(normalized);

      const now = Date.now();
      for (const [spotId, until] of Object.entries(normalized)) {
        scheduleSpotClear(spotId, Math.max(0, until - now) + 100);
      }
    },
    [clearSpotTimer, scheduleSpotClear]
  );

  const isResourceSpotActive = useCallback(
    (spotId: string) => (resourceRespawnUntil[spotId] ?? 0) <= Date.now(),
    [resourceRespawnUntil]
  );

  return {
    resourceRespawnUntil,
    isResourceSpotActive,
    despawnResourceSpot,
    hydrateResourceRespawnUntil,
  };
}
