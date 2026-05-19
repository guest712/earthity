import React from 'react';

import type { MapARSceneProps } from './mapARSceneProps';

/**
 * Dev-only: `require('./MapARScene')` must stay inside `if (__DEV__)` so Metro
 * can drop three/drei from release (see metro.config.js + MapARScene.empty).
 */
export default function MapARSceneGate(props: MapARSceneProps) {
  if (__DEV__) {
    const MapARScene = require('./MapARScene').default as React.ComponentType<MapARSceneProps>;
    return <MapARScene {...props} />;
  }
  return null;
}
