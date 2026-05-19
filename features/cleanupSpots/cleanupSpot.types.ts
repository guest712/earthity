export type MapLatLng = { latitude: number; longitude: number };

export type CleanupSpotStatus = 'open' | 'in_raid' | 'cleaned' | 'expired';

export type CleanupSpotRewardTier = 'normal' | 'rare' | 'epic';

export type CleanupSpot = {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  kind: 'trash';
  status: CleanupSpotStatus;
  note: string | null;
  createdAt: string;
  expiresAt: string | null;
  cleanedAt: string | null;
  cleanedBy: string | null;
  rewardMultiplier: number;
  rewardTier: CleanupSpotRewardTier;
};

export type CreateCleanupSpotErrorCode =
  | 'missing_supabase'
  | 'not_authenticated'
  | 'active_limit'
  | 'unknown';

export type CleanupSpotMapBounds = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};
