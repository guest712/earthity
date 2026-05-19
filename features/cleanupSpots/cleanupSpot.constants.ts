/** Max distance from player GPS to place a new cleanup marker (meters). */
export const CLEANUP_SPOT_PLACE_MAX_DISTANCE_M = 80;

/** Refetch shared spots when map region changes (debounced). */
export const CLEANUP_SPOTS_FETCH_DEBOUNCE_MS = 450;

/** Default marker lifetime (ms). */
export const CLEANUP_SPOT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Max simultaneous open / in_raid markers per user. */
export const CLEANUP_SPOT_MAX_ACTIVE_PER_USER = 3;
