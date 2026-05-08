import React, { type RefObject } from 'react';
import type { ImageRequireSource, ImageURISource } from 'react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import type MapView from 'react-native-maps';

import WorldMap from '../map/WorldMap';
import PlayerModelPreviewPanel from '../map/PlayerModelPreviewPanel';
import HomeMapLayer, { type HomeMapLayerProps } from './HomeMapLayer';
import { homeScreenStyles as styles } from './homeScreen.styles';

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
  } = props;

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

      <View style={styles.mapWrapper}>
        <WorldMap
          ref={mapRef}
          style={styles.mapInner}
          initialRegion={initialRegion}
          mapTileStyle={mapTileStyle}
          userLocation={location}
          userAvatarSource={userAvatarSource}
          userAvatarId={userAvatarId}
        >
          <HomeMapLayer {...homeMapLayerProps} />
        </WorldMap>
      </View>
      <PlayerModelPreviewPanel />
    </>
  );
}
