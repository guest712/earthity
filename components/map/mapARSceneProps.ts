import type React from 'react';
import type MapView from 'react-native-maps';
import type { ViewStyle } from 'react-native';

import type { ARObject } from './mapAR.types';

export type MapARSceneProps = {
  mapRef: React.RefObject<MapView | null>;
  objects: ARObject[];
  decorTrees?: { latitude: number; longitude: number }[];
  decorProjectEpoch?: number;
  mapMode?: '2D' | '3D_Tilt';
  regionTickRef?: React.RefObject<number>;
  style?: ViewStyle;
};
