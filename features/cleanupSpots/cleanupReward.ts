import { getDistance } from '../../lib/shared/game-utils';
import type { CleanupSpot, CleanupSpotRewardTier } from './cleanupSpot.types';
import {
  CLEANUP_REWARD_AGE_FACTOR_PER_DAY,
  CLEANUP_REWARD_DIST_FACTOR_PER_5KM,
  CLEANUP_REWARD_DIST_STEP_METERS,
  CLEANUP_REWARD_MAX_MULTIPLIER,
  CLEANUP_REWARD_TIER_EPIC_MIN,
  CLEANUP_REWARD_TIER_RARE_MIN,
  CITY_CENTER_LAT,
  CITY_CENTER_LNG,
} from './cleanupSpot.constants';

export const CLEANUP_BASE_DOBRI = 10;
export const CLEANUP_BASE_XP = 5;

/** Keep in sync with supabase/migrations/004_cleanup_reward_multiplier.sql */
export function computeCleanupRewardMultiplier(
  latitude: number,
  longitude: number,
  createdAtIso: string,
  nowMs: number = Date.now()
): number {
  const createdMs = Date.parse(createdAtIso);
  const ageDays =
    Number.isFinite(createdMs) && createdMs > 0
      ? Math.max(0, (nowMs - createdMs) / (24 * 60 * 60 * 1000))
      : 0;

  const distM = getDistance(latitude, longitude, CITY_CENTER_LAT, CITY_CENTER_LNG);
  const distKm = distM / 1000;

  const raw =
    1 +
    CLEANUP_REWARD_AGE_FACTOR_PER_DAY * ageDays +
    CLEANUP_REWARD_DIST_FACTOR_PER_5KM * (distKm / (CLEANUP_REWARD_DIST_STEP_METERS / 1000));

  return Math.min(CLEANUP_REWARD_MAX_MULTIPLIER, Math.max(1, raw));
}

export function multiplierToRewardTier(multiplier: number): CleanupSpotRewardTier {
  if (multiplier >= CLEANUP_REWARD_TIER_EPIC_MIN) return 'epic';
  if (multiplier >= CLEANUP_REWARD_TIER_RARE_MIN) return 'rare';
  return 'normal';
}

export function enrichCleanupSpot(spot: CleanupSpot, nowMs?: number): CleanupSpot {
  const rewardMultiplier = computeCleanupRewardMultiplier(
    spot.latitude,
    spot.longitude,
    spot.createdAt,
    nowMs
  );
  return {
    ...spot,
    rewardMultiplier,
    rewardTier: multiplierToRewardTier(rewardMultiplier),
  };
}

export function displayRewardMultiplier(multiplier: number): number {
  return Math.min(CLEANUP_REWARD_MAX_MULTIPLIER, Math.max(1, Math.round(multiplier)));
}

export function computeCleanupCleaningRewards(spot: CleanupSpot): {
  dobri: number;
  xp: number;
  multiplier: number;
} {
  const multiplier = spot.rewardMultiplier;
  return {
    dobri: Math.round(CLEANUP_BASE_DOBRI * multiplier),
    xp: Math.round(CLEANUP_BASE_XP * multiplier),
    multiplier,
  };
}
