import { useMemo, useCallback } from 'react';

import { QUESTS } from '../../features/quests/quest.constants';
import type { InventoryDrops } from '../../features/inventory/inventory.types';
import type { Quest } from '../shared/types';

export function useHomeQuestLists(
  category: 'all' | 'outdoor' | 'home',
  completed: number[],
  drops: InventoryDrops
) {
  const isQuestUnlocked = useCallback(
    (q: (typeof QUESTS)[number]) => {
      if (!q.unlockedBy) return true;
      return (drops[q.unlockedBy.dropId] ?? 0) >= q.unlockedBy.amount;
    },
    [drops]
  );

  const activeQuests = useMemo(
    () => QUESTS.filter((q) => !completed.includes(q.id) && isQuestUnlocked(q)),
    [completed, isQuestUnlocked]
  );

  const filterByCategory = useCallback(
    (q: Quest) => {
      if (category === 'outdoor') return q.type === 'trash' || q.type === 'help';
      if (category === 'home') return q.type === 'home';
      return true;
    },
    [category]
  );

  const filteredQuests = useMemo(
    () => activeQuests.filter(filterByCategory),
    [activeQuests, filterByCategory]
  );

  const lockedQuests = useMemo(
    () =>
      QUESTS.filter((q) => !completed.includes(q.id) && !isQuestUnlocked(q)).filter(filterByCategory),
    [completed, filterByCategory, isQuestUnlocked]
  );

  return { activeQuests, filteredQuests, lockedQuests, isQuestUnlocked };
}
