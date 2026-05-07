import type { EarthitySave, UnlockedTitle } from '../../lib/shared/types';
import {
  ACHIEVEMENTS,
  type AchievementCategory,
  type AchievementDefinition,
  type AchievementProgressSnapshot,
} from './achievements.data';

export function achievementStatsFromSave(save: EarthitySave): AchievementProgressSnapshot {
  return {
    deeds: save.deeds,
    xp: save.xp,
    outdoorDeeds: save.outdoorDeeds,
    homeDeeds: save.homeDeeds,
    petDeeds: save.petDeeds,
    totalDobri: save.totalDobri,
    testDeeds: save.testDeeds,
  };
}

/** Category order follows first appearance in `ACHIEVEMENTS`. */
export function achievementCategoriesInOrder(): AchievementCategory[] {
  return [...new Set(ACHIEVEMENTS.map((a) => a.category))];
}

export function countUnlockedAchievements(stats: AchievementProgressSnapshot): number {
  return ACHIEVEMENTS.filter((a) => a.condition(stats)).length;
}

export function isAchievementUnlocked(
  def: AchievementDefinition,
  stats: AchievementProgressSnapshot
): boolean {
  return def.condition(stats);
}

export function titleUnlocksEarnedFromProgress(stats: AchievementProgressSnapshot): UnlockedTitle[] {
  return ACHIEVEMENTS.filter((a) => a.givesTitle === true && a.condition(stats)).map((a) => ({
    id: a.id,
    title: a.title,
    emoji: a.emoji,
  }));
}

export function mergeUnlockedTitles(
  existing: UnlockedTitle[],
  additions: UnlockedTitle[]
): { merged: UnlockedTitle[]; changed: boolean } {
  const merged = [...existing];
  let changed = false;
  for (const add of additions) {
    if (!merged.some((e) => e.id === add.id)) {
      merged.push(add);
      changed = true;
    }
  }
  return { merged, changed };
}
