import type { CraftedItemId, TrashId, Translation } from '../../lib/shared/types';

export type CraftCostSlot = {
  type: TrashId;
  amount: number;
};

export type CraftRecipe = {
  id: CraftedItemId;
  emoji: string;
  label: Translation;
  description: Translation;
  cost: CraftCostSlot[];
  yield?: number;
};

export type CraftCheckResult =
  | { ok: true }
  | { ok: false; reason: 'not_enough'; missing: CraftCostSlot[] };
