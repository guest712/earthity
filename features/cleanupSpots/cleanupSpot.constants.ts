/** Max distance from player GPS to place a new cleanup marker (meters). */
export const CLEANUP_SPOT_PLACE_MAX_DISTANCE_M = 80;

/** Refetch shared spots when map region changes (debounced). */
export const CLEANUP_SPOTS_FETCH_DEBOUNCE_MS = 450;

/** Default marker lifetime (ms). */
export const CLEANUP_SPOT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Max simultaneous open / in_raid markers per user. */
export const CLEANUP_SPOT_MAX_ACTIVE_PER_USER = 3;

/** City center for distance-based reward scaling (Berlin default map). */
export const CITY_CENTER_LAT = 52.52;
export const CITY_CENTER_LNG = 13.405;

/** Reward formula — mirror SQL migration 004. */
export const CLEANUP_REWARD_MAX_MULTIPLIER = 3;
export const CLEANUP_REWARD_AGE_FACTOR_PER_DAY = 0.1;
export const CLEANUP_REWARD_DIST_FACTOR_PER_5KM = 0.05;
export const CLEANUP_REWARD_DIST_STEP_METERS = 5000;
export const CLEANUP_REWARD_TIER_RARE_MIN = 1.5;
export const CLEANUP_REWARD_TIER_EPIC_MIN = 2.5;
