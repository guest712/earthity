/**
 * Деревья‑декор на карте (атмосфера). В релизе можно включить, выставив в `true`.
 * Профилирование: `PROFILE_MAP_DECOR_TREES` — лог среднего FPS в консоль в __DEV__.
 */
export const ENABLE_MAP_DECOR_TREES = true;

export const PROFILE_MAP_DECOR_TREES = __DEV__ && false;

export const MAX_MAP_DECOR_TREES = 28;

/** Не дальше от якоря (игрок / fallback центр). */
export const MAP_DECOR_TREES_RADIUS_M = 380;

export const MAP_DECOR_TREE_MIN_GAP_M = 22;

export const MAP_DECOR_TREE_SAMPLE_ATTEMPTS = 140;
