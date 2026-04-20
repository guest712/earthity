import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

type UserLocation = {
  latitude: number;
  longitude: number;
} | null;

const HEADING_CHANGE_THRESHOLD = 5;

export function useLocationState() {
  const [location, setLocation] = useState<UserLocation>(null);
  const [isLocationFallback, setIsLocationFallback] = useState(false);
  const [heading, setHeading] = useState<number | null>(null);
  const lastHeadingRef = useRef<number | null>(null);

  useEffect(() => {
    let positionSub: Location.LocationSubscription | null = null;
    let headingSub: Location.LocationSubscription | null = null;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    const loadLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          if (__DEV__) {
            setLocation({ latitude: 52.52, longitude: 13.405 });
            setIsLocationFallback(true);
          }
          return;
        }

        if (__DEV__) {
          fallbackTimer = setTimeout(() => {
            setLocation((prev) => prev ?? { latitude: 52.52, longitude: 13.405 });
            setIsLocationFallback((prev) => prev || true);
          }, 6000);
        }

        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setLocation({
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        });
        setIsLocationFallback(false);

        positionSub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 25,
          },
          (loc) => {
            setLocation({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
            setIsLocationFallback(false);
          }
        );

        headingSub = await Location.watchHeadingAsync((h) => {
          const raw = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
          const prev = lastHeadingRef.current;
          if (prev === null || Math.abs(raw - prev) >= HEADING_CHANGE_THRESHOLD) {
            lastHeadingRef.current = raw;
            setHeading(raw);
          }
        });
      } catch (error) {
        console.warn('Location load error', error);
        if (__DEV__) {
          setLocation((prev) => prev ?? { latitude: 52.52, longitude: 13.405 });
          setIsLocationFallback(true);
        }
      }
    };

    loadLocation();

    return () => {
      positionSub?.remove();
      headingSub?.remove();
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, []);

  return { location, isLocationFallback, heading };
}