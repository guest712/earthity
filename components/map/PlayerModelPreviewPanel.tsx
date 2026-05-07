import { Canvas } from '@react-three/fiber/native';
import { Suspense, useEffect, useRef, useState } from 'react';
import {
  AppState,
  StyleSheet,
  View,
  type AppStateStatus,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';

import Model from '../three/Model';

const PLAYER_MODEL = require('../../assets/models/test_wolf.glb');

function AnimatedPlayerMesh() {
  const locomotionRef = useRef<'idle' | 'walk'>('idle');
  useEffect(() => {
    const id = setInterval(() => {
      locomotionRef.current =
        locomotionRef.current === 'idle' ? 'walk' : 'idle';
    }, 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <group rotation={[0, 0.55, 0]}>
      <Model source={PLAYER_MODEL} skinAnimationRef={locomotionRef} />
    </group>
  );
}

/**
 * TEMP: in-layout GLB preview (no MapView overlay). Remove when map AR returns.
 */
export default function PlayerModelPreviewPanel() {
  const isFocused = useIsFocused();
  const [appActive, setAppActive] = useState(
    () => AppState.currentState === 'active'
  );

  useEffect(() => {
    Model.preload(PLAYER_MODEL);
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener(
      'change',
      (s: AppStateStatus) => setAppActive(s === 'active')
    );
    return () => sub.remove();
  }, []);

  const runLoop = appActive && isFocused;

  return (
    <View style={styles.host} collapsable={false}>
      <Canvas
        style={{ flex: 1, width: '100%', height: '100%' }}
        frameloop={runLoop ? 'always' : 'never'}
        gl={{ antialias: false, powerPreference: 'low-power' }}
        camera={{ position: [0, 0, 3.2], fov: 50, near: 0.1, far: 100 }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x111111, 1);
          gl.debug.checkShaderErrors = false;
        }}
      >
        <ambientLight intensity={0.55} />
        <pointLight position={[8, 10, 8]} intensity={1.15} />
        <Suspense fallback={null}>
          <AnimatedPlayerMesh />
        </Suspense>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    height: 180,
    marginHorizontal: 12,
    marginTop: 8,
    backgroundColor: '#111',
    borderRadius: 12,
    overflow: 'hidden',
  },
});
