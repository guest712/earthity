import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadSave, updateSave } from '../../lib/storage/storage';
import type { DropId, TrashId } from '../../lib/shared/types';
import type { Resources } from '../resources/resource.types';
import {
  MAX_WATER,
  MAX_FEED,
  MAX_TRASH_PER_TYPE,
  MAX_BIO,
} from '../resources/resource.constants';
import type { InventoryApi, InventoryDrops } from './inventory.types';

const EMPTY_RESOURCES: Resources = {
  water: MAX_WATER,
  feed: 0,
  trash: { plastic: 0, glass: 0, paper: 0, bio: 0 },
};

const InventoryContext = createContext<InventoryApi | undefined>(undefined);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [resources, setResources] = useState<Resources>(EMPTY_RESOURCES);
  const [drops, setDrops] = useState<InventoryDrops>({});
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const save = await loadSave();
        if (cancelled) return;
        setResources(save.resources);
        setDrops(save.drops ?? {});
      } catch (e) {
        console.warn('Inventory load error', e);
      } finally {
        if (!cancelled) setIsHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistResources = useCallback((next: Resources) => {
    void updateSave({ resources: next });
  }, []);

  const persistDrops = useCallback((next: InventoryDrops) => {
    void updateSave({ drops: next });
  }, []);

  const addDrop = useCallback(
    (id: DropId, amount = 1) => {
      setDrops((prev) => {
        const next: InventoryDrops = { ...prev, [id]: (prev[id] ?? 0) + amount };
        persistDrops(next);
        return next;
      });
    },
    [persistDrops]
  );

  const consumeFeed = useCallback(
    (amount = 1) => {
      setResources((prev) => {
        const next: Resources = { ...prev, feed: Math.max(0, prev.feed - amount) };
        persistResources(next);
        return next;
      });
    },
    [persistResources]
  );

  const consumeWater = useCallback(
    (amount = 1) => {
      setResources((prev) => {
        const next: Resources = { ...prev, water: Math.max(0, prev.water - amount) };
        persistResources(next);
        return next;
      });
    },
    [persistResources]
  );

  const addFeed = useCallback(
    (amount: number) => {
      setResources((prev) => {
        const next: Resources = {
          ...prev,
          feed: Math.min(MAX_FEED, prev.feed + amount),
        };
        persistResources(next);
        return next;
      });
    },
    [persistResources]
  );

  const addWater = useCallback(
    (amount: number) => {
      setResources((prev) => {
        const next: Resources = {
          ...prev,
          water: Math.min(MAX_WATER, prev.water + amount),
        };
        persistResources(next);
        return next;
      });
    },
    [persistResources]
  );

  const addTrash = useCallback(
    (type: TrashId, amount: number) => {
      setResources((prev) => {
        const cap = type === 'bio' ? MAX_BIO : MAX_TRASH_PER_TYPE;
        const next: Resources = {
          ...prev,
          trash: {
            ...prev.trash,
            [type]: Math.min(cap, prev.trash[type] + amount),
          },
        };
        persistResources(next);
        return next;
      });
    },
    [persistResources]
  );

  const refillWater = useCallback(() => {
    setResources((prev) => {
      const next: Resources = { ...prev, water: MAX_WATER };
      persistResources(next);
      return next;
    });
  }, [persistResources]);

  const getDropCount = useCallback(
    (id: DropId) => drops[id] ?? 0,
    [drops]
  );

  const reload = useCallback(async () => {
    try {
      const save = await loadSave();
      setResources(save.resources);
      setDrops(save.drops ?? {});
    } catch (e) {
      console.warn('Inventory reload error', e);
    }
  }, []);

  const value = useMemo<InventoryApi>(
    () => ({
      resources,
      drops,
      isHydrated,
      addDrop,
      consumeFeed,
      consumeWater,
      addFeed,
      addWater,
      addTrash,
      refillWater,
      getDropCount,
      reload,
    }),
    [
      resources,
      drops,
      isHydrated,
      addDrop,
      consumeFeed,
      consumeWater,
      addFeed,
      addWater,
      addTrash,
      refillWater,
      getDropCount,
      reload,
    ]
  );

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory(): InventoryApi {
  const ctx = useContext(InventoryContext);
  if (!ctx) {
    throw new Error('useInventory must be used inside InventoryProvider');
  }
  return ctx;
}
