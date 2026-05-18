import type { Region } from 'react-native-maps';

import { getDistance } from '../shared/game-utils';
import {
  getSoftGreenBeltPolygon,
  greenBeltBBox,
  pointInPolygon,
  type MapLatLng,
} from './softGreenBelt';
import {
  MAP_DECOR_TREE_MIN_GAP_M,
  MAP_DECOR_TREE_SAMPLE_ATTEMPTS,
  MAP_DECOR_TREES_RADIUS_M,
  MAX_MAP_DECOR_TREES,
} from './mapDecorConfig';

function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function intersectLatLngRect(
  a: { latMin: number; latMax: number; lngMin: number; lngMax: number },
  b: { latMin: number; latMax: number; lngMin: number; lngMax: number }
): { latMin: number; latMax: number; lngMin: number; lngMax: number } | null {
  const latMin = Math.max(a.latMin, b.latMin);
  const latMax = Math.min(a.latMax, b.latMax);
  const lngMin = Math.max(a.lngMin, b.lngMin);
  const lngMax = Math.min(a.lngMax, b.lngMax);
  if (latMin >= latMax || lngMin >= lngMax) return null;
  return { latMin, latMax, lngMin, lngMax };
}

export type BuildDecorTreesArgs = {
  anchor: MapLatLng;
  /** Видимая область карты — точки только в пересечении с полигоном зелёной зоны. */
  region: Region | null;
  /** Меняется при `onRegionChangeComplete`, чтобы пересобрать выборку. */
  layoutSeed: number;
};

export function buildMapDecorTreeCoordinates({
  anchor,
  region,
  layoutSeed,
}: BuildDecorTreesArgs): MapLatLng[] {
  const poly = getSoftGreenBeltPolygon(anchor);
  const polyBox = greenBeltBBox(poly);
  let sampleBox = { ...polyBox };

  if (region != null) {
    const padLat = region.latitudeDelta * 0.42;
    const padLng = region.longitudeDelta * 0.42;
    const viewBox = {
      latMin: region.latitude - padLat,
      latMax: region.latitude + padLat,
      lngMin: region.longitude - padLng,
      lngMax: region.longitude + padLng,
    };
    const hit = intersectLatLngRect(polyBox, viewBox);
    if (hit == null) return [];
    sampleBox = hit;
  }

  const rand = mulberry32((layoutSeed >>> 0) ^ 0xb529a17c);
  const out: MapLatLng[] = [];

  for (let n = 0; n < MAP_DECOR_TREE_SAMPLE_ATTEMPTS && out.length < MAX_MAP_DECOR_TREES; n++) {
    const lat = sampleBox.latMin + rand() * (sampleBox.latMax - sampleBox.latMin);
    const lng = sampleBox.lngMin + rand() * (sampleBox.lngMax - sampleBox.lngMin);
    if (!pointInPolygon(lat, lng, poly)) continue;
    const dM = getDistance(anchor.latitude, anchor.longitude, lat, lng);
    if (dM > MAP_DECOR_TREES_RADIUS_M) continue;
    let ok = true;
    for (const q of out) {
      if (getDistance(q.latitude, q.longitude, lat, lng) < MAP_DECOR_TREE_MIN_GAP_M) {
        ok = false;
        break;
      }
    }
    if (ok) out.push({ latitude: lat, longitude: lng });
  }

  return out;
}
