import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import type { Region } from 'react-native-maps';

import {
  CLEANUP_SPOT_PLACE_MAX_DISTANCE_M,
  CLEANUP_SPOTS_FETCH_DEBOUNCE_MS,
} from '../../features/cleanupSpots/cleanupSpot.constants';
import type { CleanupSpot, MapLatLng } from '../../features/cleanupSpots/cleanupSpot.types';
import type { LocaleStrings } from '../i18n/locale-strings';
import { getDistance } from '../shared/game-utils';
import {
  createCleanupSpotAt,
  deleteOwnCleanupSpot,
  fetchCleanupSpotsInBounds,
  getCurrentAuthUserId,
  markCleanupSpotCleaned,
  regionToCleanupBounds,
} from '../supabase/cleanupSpots';
import { isSupabaseConfigured } from '../supabase/client';

type Args = {
  t: LocaleStrings;
  location: MapLatLng | null;
  mapRegion: Region | null;
  devBypassDistance: boolean;
};

export function useCleanupSpotsMap({ t, location, mapRegion, devBypassDistance }: Args) {
  const [spots, setSpots] = useState<CleanupSpot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<CleanupSpot | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placementMode, setPlacementMode] = useState(false);
  const [draftCoordinate, setDraftCoordinate] = useState<MapLatLng | null>(null);
  const fetchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshSpots = useCallback(async (region: Region) => {
    if (!isSupabaseConfigured()) {
      setSpots([]);
      return;
    }
    const bounds = regionToCleanupBounds(region);
    const rows = await fetchCleanupSpotsInBounds(bounds);
    setSpots(rows);
  }, []);

  const exitPlacementMode = useCallback(() => {
    setPlacementMode(false);
    setDraftCoordinate(null);
  }, []);

  const isWithinPlacementRadius = useCallback(
    (coord: MapLatLng): boolean => {
      if (!location) return false;
      if (devBypassDistance) return true;
      return (
        getDistance(location.latitude, location.longitude, coord.latitude, coord.longitude) <=
        CLEANUP_SPOT_PLACE_MAX_DISTANCE_M
      );
    },
    [devBypassDistance, location]
  );

  useEffect(() => {
    void getCurrentAuthUserId().then(setCurrentUserId);
  }, []);

  useEffect(() => {
    if (!mapRegion && location && isSupabaseConfigured()) {
      void refreshSpots({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    }
  }, [location, mapRegion, refreshSpots]);

  useEffect(() => {
    if (!mapRegion || !isSupabaseConfigured()) return;

    if (fetchDebounceRef.current) {
      clearTimeout(fetchDebounceRef.current);
    }

    fetchDebounceRef.current = setTimeout(() => {
      void refreshSpots(mapRegion);
    }, CLEANUP_SPOTS_FETCH_DEBOUNCE_MS);

    return () => {
      if (fetchDebounceRef.current) {
        clearTimeout(fetchDebounceRef.current);
      }
    };
  }, [mapRegion, refreshSpots]);

  const submitPlacementAt = useCallback(
    (coord: MapLatLng) => {
      if (!isSupabaseConfigured()) {
        Alert.alert(t.cleanupReportError);
        return;
      }

      Alert.alert(t.cleanupReportTitle, t.cleanupReportMessage, [
        { text: t.cleanupReportCancel, style: 'cancel' },
        {
          text: t.cleanupReportConfirm,
          onPress: () => {
            void (async () => {
              setIsSubmitting(true);
              try {
                const { spot, error, errorCode } = await createCleanupSpotAt(
                  coord.latitude,
                  coord.longitude,
                  t.cleanupReportMessage
                );
                if (errorCode === 'active_limit') {
                  Alert.alert(t.cleanupReportActiveLimitTitle, t.cleanupReportActiveLimitBody);
                  return;
                }
                if (error || !spot) {
                  Alert.alert(t.cleanupReportError);
                  return;
                }
                exitPlacementMode();
                setSpots((prev) => {
                  const without = prev.filter((s) => s.id !== spot.id);
                  return [spot, ...without];
                });
                setSelectedSpot(spot);
                Alert.alert(t.cleanupReportSuccess);
                if (mapRegion) {
                  await refreshSpots(mapRegion);
                }
              } finally {
                setIsSubmitting(false);
              }
            })();
          },
        },
      ]);
    },
    [exitPlacementMode, mapRegion, refreshSpots, t]
  );

  const onMapPressPlacement = useCallback(
    (coord: MapLatLng) => {
      if (!placementMode || !location) return;

      if (!isWithinPlacementRadius(coord)) {
        Alert.alert(t.cleanupPlacementTooFarTitle, t.cleanupPlacementTooFarBody);
        return;
      }

      setDraftCoordinate(coord);
    },
    [isWithinPlacementRadius, location, placementMode, t]
  );

  const confirmPlacementDraft = useCallback(() => {
    if (!draftCoordinate) {
      Alert.alert(t.cleanupPlacementPickFirst);
      return;
    }
    submitPlacementAt(draftCoordinate);
  }, [draftCoordinate, submitPlacementAt, t.cleanupPlacementPickFirst]);

  const onPressReportTrash = useCallback(() => {
    if (!location) {
      Alert.alert(t.cleanupReportNoLocation);
      return;
    }
    if (!isSupabaseConfigured()) {
      Alert.alert(t.cleanupReportError);
      return;
    }

    if (placementMode) {
      exitPlacementMode();
      return;
    }

    setPlacementMode(true);
    setDraftCoordinate(null);
  }, [exitPlacementMode, location, placementMode, t]);

  const onPressSpot = useCallback(
    (spot: CleanupSpot) => {
      if (placementMode) return;
      setSelectedSpot(spot);
    },
    [placementMode]
  );

  const dismissSpot = useCallback(() => {
    setSelectedSpot(null);
  }, []);

  const markSelectedCleaned = useCallback(() => {
    if (!selectedSpot) return;

    Alert.alert(t.cleanupSpotTitle, t.cleanupSpotMarkCleanedConfirm, [
      { text: t.no, style: 'cancel' },
      {
        text: t.yes,
        onPress: () => {
          void (async () => {
            setIsSubmitting(true);
            try {
              const { ok } = await markCleanupSpotCleaned(selectedSpot.id);
              if (!ok) {
                Alert.alert(t.cleanupReportError);
                return;
              }
              setSpots((prev) => prev.filter((s) => s.id !== selectedSpot.id));
              setSelectedSpot(null);
              Alert.alert(t.cleanupSpotCleanedSuccess);
              if (mapRegion) {
                await refreshSpots(mapRegion);
              }
            } finally {
              setIsSubmitting(false);
            }
          })();
        },
      },
    ]);
  }, [mapRegion, refreshSpots, selectedSpot, t]);

  const deleteSelectedOwnSpot = useCallback(() => {
    if (!selectedSpot) return;

    Alert.alert(t.cleanupSpotYourReport, t.cleanupSpotDeleteConfirm, [
      { text: t.no, style: 'cancel' },
      {
        text: t.yes,
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setIsSubmitting(true);
            try {
              const ok = await deleteOwnCleanupSpot(selectedSpot.id);
              if (!ok) {
                Alert.alert(t.cleanupReportError);
                return;
              }
              setSpots((prev) => prev.filter((s) => s.id !== selectedSpot.id));
              setSelectedSpot(null);
              if (mapRegion) {
                await refreshSpots(mapRegion);
              }
            } finally {
              setIsSubmitting(false);
            }
          })();
        },
      },
    ]);
  }, [mapRegion, refreshSpots, selectedSpot, t]);

  return {
    cleanupSpots: spots,
    selectedCleanupSpot: selectedSpot,
    currentUserId,
    isCleanupSubmitting: isSubmitting,
    cleanupPlacementMode: placementMode,
    cleanupDraftCoordinate: draftCoordinate,
    cleanupPlacementRadiusM: CLEANUP_SPOT_PLACE_MAX_DISTANCE_M,
    onPressReportTrash,
    onMapPressPlacement,
    confirmPlacementDraft,
    cancelPlacementMode: exitPlacementMode,
    onPressCleanupSpot: onPressSpot,
    dismissCleanupSpot: dismissSpot,
    markSelectedCleanupCleaned: markSelectedCleaned,
    deleteSelectedOwnCleanupSpot: deleteSelectedOwnSpot,
  };
}
