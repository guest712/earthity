import type { CleanupSpot } from '../../features/cleanupSpots/cleanupSpot.types';

export function getCleanupSpotMarkerStyle(
  spot: CleanupSpot,
  selected: boolean
): { backgroundColor: string; borderColor: string; borderWidth: number } {
  if (selected) {
    return {
      backgroundColor: 'rgba(232,160,80,0.4)',
      borderColor: '#e8a050',
      borderWidth: 2,
    };
  }

  if (spot.rewardTier === 'epic') {
    return {
      backgroundColor: 'rgba(232, 201, 122, 0.35)',
      borderColor: '#e8c97a',
      borderWidth: 2,
    };
  }

  if (spot.rewardTier === 'rare') {
    return {
      backgroundColor: 'rgba(232, 160, 80, 0.22)',
      borderColor: '#d09050',
      borderWidth: 1,
    };
  }

  return {
    backgroundColor: 'rgba(12,18,12,0.55)',
    borderColor: '#5aad6a',
    borderWidth: 1,
  };
}
