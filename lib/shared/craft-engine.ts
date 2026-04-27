import type { Trash } from '../../features/resources/resource.types';
import type { CraftCheckResult, CraftRecipe } from '../../features/crafting/craft.types';

export function checkCraftAffordable(
  recipe: CraftRecipe,
  trash: Trash
): CraftCheckResult {
  const missing = recipe.cost
    .filter((c) => trash[c.type] < c.amount)
    .map((c) => ({ type: c.type, amount: c.amount - trash[c.type] }));

  if (missing.length > 0) {
    return { ok: false, reason: 'not_enough', missing };
  }
  return { ok: true };
}

export function applyCraftCost(recipe: CraftRecipe, trash: Trash): Trash {
  const next: Trash = { ...trash };
  for (const c of recipe.cost) {
    next[c.type] = Math.max(0, next[c.type] - c.amount);
  }
  return next;
}
