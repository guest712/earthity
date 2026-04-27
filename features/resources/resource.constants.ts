export const WATER_SPOTS = [
  { id: 'water1' },
  { id: 'water2' },
  { id: 'water3' },
];

export const FEED_SPOTS = [
  { id: 'feed1' },
  { id: 'feed2' },
  { id: 'feed3' },
];

export const TRASH_SPOTS = [
  { id: 'trash1', type: 'plastic' },
  { id: 'trash2', type: 'glass' },
  { id: 'trash3', type: 'paper' },
];
export const BIO_SPOTS = [{ id: 'bio1' }, { id: 'bio2' }];

export const MAX_WATER = 10;
export const MAX_FEED = 20;
export const MAX_TRASH_PER_TYPE = 150;
export const MAX_BIO = 100;
export const FEED_PICKUP_AMOUNT = 2;
export const TRASH_PICKUP_AMOUNT = 5;
export const BIO_PICKUP_AMOUNT = 4;
export const RESOURCE_INTERACTION_DISTANCE = 150;
export const ACTION_COOLDOWN_MS = 700;
export const RESOURCE_SPOT_RESPAWN_MS = 60000;