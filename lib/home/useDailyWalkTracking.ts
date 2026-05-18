import { useEffect, useRef } from 'react';

import type { DailyQuestKind } from '../shared/types';
import { getDistance } from '../shared/game-utils';

type WalkPos = { latitude: number; longitude: number };

/** Matches `DailyQuestsProvider`: GPS leg when pedometer is not used. */
export type HomeWalkTrackingKind = 'pending' | 'pedometer' | 'gps';

export function useDailyWalkTracking(
  walkTrackingKind: HomeWalkTrackingKind,
  location: WalkPos | null,
  isLocationFallback: boolean,
  incrementDaily: (kind: DailyQuestKind, amount?: number) => void
) {
  const lastWalkPosRef = useRef<WalkPos | null>(null);

  useEffect(() => {
    if (walkTrackingKind !== 'gps') {
      lastWalkPosRef.current = location ?? null;
      return;
    }
    if (!location || isLocationFallback) {
      lastWalkPosRef.current = location ?? null;
      return;
    }
    const prev = lastWalkPosRef.current;
    if (!prev) {
      lastWalkPosRef.current = location;
      return;
    }
    const stepMeters = getDistance(
      prev.latitude,
      prev.longitude,
      location.latitude,
      location.longitude
    );
    if (stepMeters >= 10 && stepMeters <= 250) {
      incrementDaily('walk_meters', Math.round(stepMeters));
    }
    lastWalkPosRef.current = location;
  }, [location, isLocationFallback, incrementDaily, walkTrackingKind]);
}
