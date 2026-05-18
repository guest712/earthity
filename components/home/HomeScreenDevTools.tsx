import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { homeScreenStyles as styles } from './homeScreen.styles';

export type HomeScreenDevToolsProps = {
  isLocationFallback: boolean;
  showDevPanel: boolean;
  onToggleDevPanel: () => void;
  devIgnoreInteractionDistance: boolean;
  onToggleIgnoreDistance: () => void;
  autoCompass2DEnabled: boolean;
  onToggleAutoCompass2D: () => void;
  autoCompass3DEnabled: boolean;
  onToggleAutoCompass3D: () => void;
  onOpenThreeTest: () => void;
  onDevAddWater3: () => void;
  onDevAddFeed3: () => void;
  onDevAddBio: () => void;
  onResetSave: () => Promise<void>;
  mapDecorTreesEnabled?: boolean;
  onToggleMapDecorTrees?: () => void;
  /** Player AR (3D-model on map). Drives both the WorldMap marker visibility and `MapARScene` player object. */
  playerArEnabled?: boolean;
  onTogglePlayerAr?: () => void;
};

export default function HomeScreenDevTools(props: HomeScreenDevToolsProps) {
  if (!__DEV__) {
    return null;
  }

  const {
    isLocationFallback,
    showDevPanel,
    onToggleDevPanel,
    devIgnoreInteractionDistance,
    onToggleIgnoreDistance,
    autoCompass2DEnabled,
    onToggleAutoCompass2D,
    autoCompass3DEnabled,
    onToggleAutoCompass3D,
    onOpenThreeTest,
    onDevAddWater3,
    onDevAddFeed3,
    onDevAddBio,
    onResetSave,
    mapDecorTreesEnabled,
    onToggleMapDecorTrees,
    playerArEnabled,
    onTogglePlayerAr,
  } = props;

  return (
    <>
      {isLocationFallback && (
        <View style={styles.devGeoHint}>
          <Text style={styles.devGeoHintText}>DEV GEO: fallback location active</Text>
        </View>
      )}
      <View style={styles.devDock}>
        <TouchableOpacity style={styles.devBtn} onPress={onToggleDevPanel}>
          <Text style={styles.devBtnText}>DEV</Text>
        </TouchableOpacity>
      </View>
      {showDevPanel && (
        <View style={styles.devPanel}>
          {onTogglePlayerAr != null && playerArEnabled != null ? (
            <TouchableOpacity
              style={[styles.devPanelBtn, playerArEnabled && styles.devPanelBtnActive]}
              onPress={onTogglePlayerAr}
            >
              <Text style={styles.devPanelBtnText}>
                включить 3д-модель: {playerArEnabled ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>
          ) : null}
          {onToggleMapDecorTrees != null && mapDecorTreesEnabled != null ? (
            <TouchableOpacity
              style={[styles.devPanelBtn, mapDecorTreesEnabled && styles.devPanelBtnActive]}
              onPress={onToggleMapDecorTrees}
            >
              <Text style={styles.devPanelBtnText}>
                map decor trees: {mapDecorTreesEnabled ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={[styles.devPanelBtn, devIgnoreInteractionDistance && styles.devPanelBtnActive]}
            onPress={onToggleIgnoreDistance}
          >
            <Text style={styles.devPanelBtnText}>
              ignore all distance: {devIgnoreInteractionDistance ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.devPanelBtn, autoCompass2DEnabled && styles.devPanelBtnActive]}
            onPress={onToggleAutoCompass2D}
          >
            <Text style={styles.devPanelBtnText}>
              auto-compass 2D: {autoCompass2DEnabled ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.devPanelBtn, autoCompass3DEnabled && styles.devPanelBtnActive]}
            onPress={onToggleAutoCompass3D}
          >
            <Text style={styles.devPanelBtnText}>
              auto-compass 3D: {autoCompass3DEnabled ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.devPanelBtn} onPress={onOpenThreeTest}>
            <Text style={styles.devPanelBtnText}>open 3D test</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.devPanelBtn} onPress={onDevAddWater3}>
            <Text style={styles.devPanelBtnText}>+3 water</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.devPanelBtn} onPress={onDevAddFeed3}>
            <Text style={styles.devPanelBtnText}>+3 feed</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.devPanelBtn} onPress={onDevAddBio}>
            <Text style={styles.devPanelBtnText}>+bio</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.devPanelBtnDanger}
            onPress={() => {
              void onResetSave();
            }}
          >
            <Text style={styles.devPanelBtnText}>reset save</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}
