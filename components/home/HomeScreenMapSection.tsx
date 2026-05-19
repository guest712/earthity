import React, { type RefObject, useMemo } from 'react';
import type { ImageRequireSource, ImageURISource } from 'react-native';
import { Platform, ScrollView, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import type MapView from 'react-native-maps';
import type { MapPressEvent, Region } from 'react-native-maps';

import MapARScene, { type ARObject } from '../map/MapARScene';
import WorldMap from '../map/WorldMap';
// Превью GLB под картой (рендер-бокс). Раскомментировать import + блок ниже для локального теста модели на Home.
// import PlayerModelPreviewPanel from '../map/PlayerModelPreviewPanel';
import HomeResourceStrip, { type HomeResourceStripProps } from './HomeResourceStrip';
import HomeMapLayer, { type HomeMapLayerProps } from './HomeMapLayer';
import { homeScreenStyles as styles, HOME_MAP_CHROME_PADDING } from './homeScreen.styles';

const HOME_MAP_HEIGHT_MIN = 284;
const HOME_MAP_HEIGHT_MAX = 400;
const HOME_MAP_SCREEN_FRACTION = 0.42;

export type HomeScreenMapSectionProps = {
  mapRef: RefObject<MapView | null>;
  mapTileStyle: 'standard' | 'satellite';
  mapMode: '2D' | '3D_Tilt';
  isAutoCompassCurrentModeEnabled: boolean;
  autoCompass2DEnabled: boolean;
  autoCompass3DEnabled: boolean;
  location: { latitude: number; longitude: number } | null;
  userAvatarSource: ImageRequireSource | ImageURISource;
  userAvatarId: string;
  homeMapLayerProps: HomeMapLayerProps;
  onSelectStandardMap: () => void;
  onSelectSatelliteMap: () => void;
  onToggle2D3D: () => void;
  onToggleAutoCompass: () => void;
  onRecenter: () => void;
  resourceStrip: Omit<HomeResourceStripProps, 'style'>;
  mapRegionTickRef: RefObject<number>;
  decorTreeCoordinates: { latitude: number; longitude: number }[];
  mapDecorEnabled: boolean;
  decorProjectEpoch: number;
  mapArObjects: ARObject[];
  /** Hide custom 2D avatar marker (used when 3D player is rendered through `MapARScene`). */
  hideUserMarker?: boolean;
  onMapRegionChangeComplete: (region: Region) => void;
  onMapLayoutReady: () => void;
  onPressReportCleanup: () => void;
  isCleanupSubmitting: boolean;
  cleanupPlacementMode: boolean;
  cleanupPlacementHint: string;
  cleanupDraftReady: boolean;
  onMapPressPlacement: (coord: { latitude: number; longitude: number }) => void;
  onConfirmPlacement: () => void;
  onCancelPlacement: () => void;
};

export default function HomeScreenMapSection(props: HomeScreenMapSectionProps) {
  const {
    mapRef,
    mapTileStyle,
    mapMode,
    isAutoCompassCurrentModeEnabled,
    autoCompass2DEnabled,
    autoCompass3DEnabled,
    location,
    userAvatarSource,
    userAvatarId,
    homeMapLayerProps,
    onSelectStandardMap,
    onSelectSatelliteMap,
    onToggle2D3D,
    onToggleAutoCompass,
    onRecenter,
    resourceStrip,
    mapRegionTickRef,
    decorTreeCoordinates,
    mapDecorEnabled,
    decorProjectEpoch,
    mapArObjects,
    hideUserMarker,
    onMapRegionChangeComplete,
    onMapLayoutReady,
    onPressReportCleanup,
    isCleanupSubmitting,
    cleanupPlacementMode,
    cleanupPlacementHint,
    cleanupDraftReady,
    onMapPressPlacement,
    onConfirmPlacement,
    onCancelPlacement,
  } = props;

  const handleMapPress = (event: MapPressEvent) => {
    if (!cleanupPlacementMode) return;
    const { coordinate } = event.nativeEvent;
    onMapPressPlacement(coordinate);
  };

  const { height: windowHeight } = useWindowDimensions();
  const mapHeight = useMemo(() => {
    const fromScreen = Math.round(windowHeight * HOME_MAP_SCREEN_FRACTION);
    return Math.min(HOME_MAP_HEIGHT_MAX, Math.max(HOME_MAP_HEIGHT_MIN, fromScreen));
  }, [windowHeight]);

  const initialRegion = location
    ? {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }
    : {
        latitude: 52.52,
        longitude: 13.405,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };

  return (
    <>
      <View style={styles.mapControls}>
        <TouchableOpacity
          style={[styles.mapBtn, mapTileStyle === 'standard' && styles.mapBtnActive]}
          onPress={onSelectStandardMap}
        >
          <Text style={styles.mapBtnText}>🗺️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mapBtn, mapTileStyle === 'satellite' && styles.mapBtnActive]}
          onPress={onSelectSatelliteMap}
        >
          <Text style={styles.mapBtnText}>🛰️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mapBtn, mapMode === '3D_Tilt' && styles.mapBtnActive3D]}
          onPress={onToggle2D3D}
        >
          <Text style={styles.mapBtnText}>{mapMode === '3D_Tilt' ? '🧭' : '2D'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mapBtn, isAutoCompassCurrentModeEnabled && styles.mapBtnActive3D]}
          onPress={onToggleAutoCompass}
        >
          <Text style={styles.mapBtnText}>
            {mapMode === '3D_Tilt'
              ? `🧭${autoCompass3DEnabled ? '✓' : '✕'}`
              : `N${autoCompass2DEnabled ? '✓' : '✕'}`}
          </Text>
        </TouchableOpacity>
        {location ? (
          <TouchableOpacity style={styles.mapBtn} onPress={onRecenter}>
            <Text style={styles.mapBtnText}>📍</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={[styles.mapWrapper, { height: mapHeight }]}>
        <WorldMap
          ref={mapRef}
          style={styles.mapInner}
          initialRegion={initialRegion}
          mapTileStyle={mapTileStyle}
          mapChromePadding={HOME_MAP_CHROME_PADDING}
          userLocation={location}
          userAvatarSource={userAvatarSource}
          userAvatarId={userAvatarId}
          hideUserMarker={hideUserMarker}
          onRegionChangeComplete={onMapRegionChangeComplete}
          onMapReady={onMapLayoutReady}
          onPress={cleanupPlacementMode ? handleMapPress : undefined}
        >
          <HomeMapLayer {...homeMapLayerProps} />
        </WorldMap>
        {cleanupPlacementMode ? (
          <View style={styles.cleanupPlacementBanner} pointerEvents="box-none">
            <Text style={styles.cleanupPlacementBannerText}>{cleanupPlacementHint}</Text>
            <View style={styles.cleanupPlacementActions}>
              {cleanupDraftReady ? (
                <TouchableOpacity
                  style={[styles.cleanupPlacementActionBtn, styles.cleanupPlacementConfirmBtn]}
                  onPress={onConfirmPlacement}
                  disabled={isCleanupSubmitting}
                >
                  <Text style={styles.cleanupPlacementConfirmText}>✓</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={styles.cleanupPlacementActionBtn}
                onPress={onCancelPlacement}
                disabled={isCleanupSubmitting}
              >
                <Text style={styles.cleanupPlacementCancelText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
        {mapArObjects.length > 0 ||
        (mapDecorEnabled && decorTreeCoordinates.length > 0) ? (
          <MapARScene
            mapRef={mapRef}
            objects={mapArObjects}
            decorTrees={
              mapDecorEnabled && decorTreeCoordinates.length > 0
                ? decorTreeCoordinates
                : undefined
            }
            decorProjectEpoch={decorProjectEpoch}
            mapMode={mapMode}
            regionTickRef={mapRegionTickRef}
          />
        ) : null}
        <TouchableOpacity
          style={[
            styles.cleanupReportBtn,
            cleanupPlacementMode && styles.cleanupReportBtnActive,
          ]}
          onPress={onPressReportCleanup}
          disabled={isCleanupSubmitting}
          activeOpacity={0.85}
        >
          <Text style={styles.cleanupReportBtnText}>🗑️</Text>
        </TouchableOpacity>
        <View
          style={[styles.mapResourceOverlay, Platform.OS === 'android' && { elevation: 8 }]}
          pointerEvents="box-none"
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            style={styles.mapResourceOverlayScroll}
            contentContainerStyle={styles.mapResourceOverlayScrollContent}
          >
            <View style={styles.mapResourcesChipsShell}>
              <HomeResourceStrip {...resourceStrip} style={styles.resourcesStripOnMap} />
            </View>
          </ScrollView>
        </View>
      </View>
      {/* <PlayerModelPreviewPanel /> */}
    </>
  );
}
