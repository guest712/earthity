import { useCallback, useEffect, useRef, type RefObject } from 'react';
import type MapView from 'react-native-maps';

const TILT_OFFSET_M = 120;
const EARTH_R_M = 6371000;

export function offsetCenterForTilt(
  latitude: number,
  longitude: number,
  bearingDeg: number
): { latitude: number; longitude: number } {
  const bearRad = (bearingDeg * Math.PI) / 180;
  const dLat = (TILT_OFFSET_M / EARTH_R_M) * (180 / Math.PI) * Math.cos(bearRad);
  const dLng =
    ((TILT_OFFSET_M / EARTH_R_M) * (180 / Math.PI) * Math.sin(bearRad)) /
    Math.cos((latitude * Math.PI) / 180);
  return {
    latitude: latitude + dLat,
    longitude: longitude + dLng,
  };
}

type MapMode = '2D' | '3D_Tilt';

type Params = {
  mapRef: RefObject<MapView | null>;
  location: { latitude: number; longitude: number } | null;
  heading: number | null;
  mapMode: MapMode;
  autoCompass2DEnabled: boolean;
  autoCompass3DEnabled: boolean;
};

export function useHomeMapCamera({
  mapRef,
  location,
  heading,
  mapMode,
  autoCompass2DEnabled,
  autoCompass3DEnabled,
}: Params) {
  const lastMapCameraModeRef = useRef<MapMode | null>(null);

  useEffect(() => {
    if (!location) return;

    const prevMode = lastMapCameraModeRef.current;
    const modeChanged = prevMode !== mapMode;
    if (prevMode !== null && !modeChanged) {
      return;
    }
    const isSwitching = prevMode !== null && prevMode !== mapMode;
    lastMapCameraModeRef.current = mapMode;

    const bear = heading ?? 0;
    const heading2D = autoCompass2DEnabled ? bear : 0;
    const heading3D = autoCompass3DEnabled ? bear : 0;

    if (mapMode === '3D_Tilt') {
      const center = offsetCenterForTilt(location.latitude, location.longitude, bear);
      mapRef.current?.animateCamera(
        {
          center,
          pitch: 60,
          heading: heading3D,
          zoom: 18,
        },
        { duration: isSwitching ? 700 : 300 }
      );
    } else {
      mapRef.current?.animateCamera(
        {
          center: { latitude: location.latitude, longitude: location.longitude },
          pitch: 0,
          heading: heading2D,
          zoom: 17,
        },
        { duration: isSwitching ? 700 : 300 }
      );
    }
  }, [mapRef, location, heading, mapMode, autoCompass2DEnabled, autoCompass3DEnabled]);

  useEffect(() => {
    if (!mapRef.current || heading == null) return;

    if (mapMode === '2D') {
      if (!autoCompass2DEnabled) return;
      mapRef.current.animateCamera(
        {
          heading,
          pitch: 0,
        },
        { duration: 220 }
      );
      return;
    }

    if (mapMode === '3D_Tilt') {
      if (!autoCompass3DEnabled) return;
      mapRef.current.animateCamera(
        {
          heading,
          pitch: 60,
        },
        { duration: 220 }
      );
    }
  }, [mapRef, heading, mapMode, autoCompass2DEnabled, autoCompass3DEnabled]);

  const recenterOnUser = useCallback(() => {
    if (!location) return;

    if (mapMode === '3D_Tilt') {
      const bear = autoCompass3DEnabled ? (heading ?? 0) : 0;
      const center = offsetCenterForTilt(location.latitude, location.longitude, bear);
      mapRef.current?.animateCamera(
        {
          center,
          pitch: 60,
          heading: bear,
          zoom: 18,
        },
        { duration: 400 }
      );
    } else {
      mapRef.current?.animateToRegion(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        250
      );
    }
  }, [mapRef, location, heading, mapMode, autoCompass3DEnabled]);

  return { recenterOnUser };
}
