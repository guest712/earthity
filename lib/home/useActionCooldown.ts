import { useCallback, useRef } from 'react';

import { ACTION_COOLDOWN_MS } from '../../features/resources/resource.constants';

export type ActionCooldownKind = 'creature' | 'water' | 'feed' | 'trash' | 'bio';

export function useActionCooldown() {
  const lastActionAtRef = useRef({
    creature: 0,
    water: 0,
    feed: 0,
    trash: 0,
    bio: 0,
  });

  const isActionCoolingDown = useCallback((kind: ActionCooldownKind): boolean => {
    const now = Date.now();
    if (now - lastActionAtRef.current[kind] < ACTION_COOLDOWN_MS) {
      return true;
    }
    lastActionAtRef.current[kind] = now;
    return false;
  }, []);

  return { isActionCoolingDown };
}
