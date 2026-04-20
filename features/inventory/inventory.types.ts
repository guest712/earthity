import type { DropId, InventoryItemId, TrashId } from '../../lib/shared/types';
import type { Resources } from '../resources/resource.types';

export type InventoryCategory = 'resources' | 'food' | 'quest_items';

export type InventoryDrops = Partial<Record<DropId, number>>;

export type InventoryState = {
  resources: Resources;
  drops: InventoryDrops;
  isHydrated: boolean;
};

export type InventoryApi = InventoryState & {
  addDrop: (id: DropId, amount?: number) => void;
  consumeFeed: (amount?: number) => void;
  consumeWater: (amount?: number) => void;
  addFeed: (amount: number) => void;
  addWater: (amount: number) => void;
  addTrash: (type: TrashId, amount: number) => void;
  refillWater: () => void;
  getDropCount: (id: DropId) => number;
  reload: () => Promise<void>;
};

export type { InventoryItemId };
