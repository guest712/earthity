import { useMemo } from 'react';
import type { Region } from 'react-native-maps';

import { buildMapDecorTreeCoordinates } from '../map/buildMapDecorTreeCoordinates';
import { ENABLE_MAP_DECOR_TREES } from '../map/mapDecorConfig';
import type { MapLatLng } from '../map/softGreenBelt';

const DEFAULT_ANCHOR: MapLatLng = { latitude: 52.52, longitude: 13.405 };

export function useMapDecorTreeCoordinates(params: {
  enabled: boolean;
  location: { latitude: number; longitude: number } | null;
  region: Region | null;
  /** Только смена видимого региона (`onRegionChangeComplete`), не каждый кадр. */
  regionLayoutSeed: number;
}): MapLatLng[] {
  const { enabled, location, region, regionLayoutSeed } = params;

  return useMemo(() => {
    if (!enabled || !ENABLE_MAP_DECOR_TREES) return [];
    const anchor: MapLatLng = location ?? DEFAULT_ANCHOR;
    return buildMapDecorTreeCoordinates({ anchor, region, layoutSeed: regionLayoutSeed });
  }, [
    enabled,
    location?.latitude,
    location?.longitude,
    region?.latitude,
    region?.longitude,
    region?.latitudeDelta,
    region?.longitudeDelta,
    regionLayoutSeed,
  ]);
}
