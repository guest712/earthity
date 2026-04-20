import type { InventoryCategory, InventoryItemId } from './inventory.types';

export const ITEM_CATEGORY: Record<InventoryItemId, InventoryCategory> = {
  water: 'resources',
  watering_can: 'resources',
  plastic: 'resources',
  glass: 'resources',
  paper: 'resources',
  bio: 'resources',

  feed: 'food',

  feather: 'quest_items',
  wool: 'quest_items',
  pollen: 'quest_items',
  scale: 'quest_items',
  petal: 'quest_items',
  seed: 'quest_items',
};

export const INVENTORY_CATEGORIES: InventoryCategory[] = [
  'resources',
  'food',
  'quest_items',
];
