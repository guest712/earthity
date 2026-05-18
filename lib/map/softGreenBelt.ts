export type MapLatLng = { latitude: number; longitude: number };

const OFFSETS: { dLat: number; dLng: number }[] = [
  { dLat: 0.002, dLng: -0.003 },
  { dLat: 0.004, dLng: -0.001 },
  { dLat: 0.003, dLng: 0.003 },
  { dLat: -0.001, dLng: 0.002 },
  { dLat: -0.002, dLng: -0.002 },
];

export function getSoftGreenBeltPolygon(anchor: { latitude: number; longitude: number }): MapLatLng[] {
  return OFFSETS.map((o) => ({
    latitude: anchor.latitude + o.dLat,
    longitude: anchor.longitude + o.dLng,
  }));
}

export function greenBeltBBox(poly: MapLatLng[]): {
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
} {
  let latMin = poly[0]!.latitude;
  let latMax = poly[0]!.latitude;
  let lngMin = poly[0]!.longitude;
  let lngMax = poly[0]!.longitude;
  for (const p of poly) {
    latMin = Math.min(latMin, p.latitude);
    latMax = Math.max(latMax, p.latitude);
    lngMin = Math.min(lngMin, p.longitude);
    lngMax = Math.max(lngMax, p.longitude);
  }
  return { latMin, latMax, lngMin, lngMax };
}

export function pointInPolygon(lat: number, lng: number, poly: MapLatLng[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const yi = poly[i]!.latitude;
    const xi = poly[i]!.longitude;
    const yj = poly[j]!.latitude;
    const xj = poly[j]!.longitude;
    const intersect =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
