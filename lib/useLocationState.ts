import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

type UserLocation = {
  latitude: number;
  longitude: number;
} | null;

export function useLocationState() {
  const [location, setLocation] = useState<UserLocation>(null);

  useEffect(() => {
    const loadLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      } catch (error) {
        console.warn('Location load error', error);
      }
    };

    loadLocation();
  }, []);

  return { location };
}