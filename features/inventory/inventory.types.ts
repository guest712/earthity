import type {
  CraftedItemId,
  DropId,
  InventoryItemId,
  TrashId,
} from '../../lib/shared/types';
import type { Resources } from '../resources/resource.types';

export type InventoryCategory =
  | 'resources'
  | 'food'
  | 'quest_items'
  | 'crafted';

export type InventoryDrops = Partial<Record<DropId, number>>;
export type InventoryCrafted = Partial<Record<CraftedItemId, number>>;

export type InventoryState = {
  resources: Resources;
  drops: InventoryDrops;
  crafted: InventoryCrafted;
  isHydrated: boolean;
};

export type InventoryApi = InventoryState & {
  addDrop: (id: DropId, amount?: number) => void;
  consumeFeed: (amount?: number) => void;
  consumeWater: (amount?: number) => void;
  addFeed: (amount: number) => void;
  addWater: (amount: number) => void;
  addTrash: (type: TrashId, amount: number) => void;
  setTrash: (next: Resources['trash']) => void;
  refillWater: () => void;
  addCrafted: (id: CraftedItemId, amount?: number) => void;
  getDropCount: (id: DropId) => number;
  getCraftedCount: (id: CraftedItemId) => number;
  reload: () => Promise<void>;
};

export type { InventoryItemId };
