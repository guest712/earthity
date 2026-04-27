import { Canvas, useFrame } from '@react-three/fiber/native';
import { useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus, type ViewStyle } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import type { Group } from 'three';

import Model from './Model';

type Props = {
  style?: ViewStyle;
  /** Clear color for the framebuffer. */
  backgroundColor?: string;
};

/**
 * Source of the test model. Kept as a module-scope `require` so it's resolved
 * once and can be preloaded (see ThreeTestScreen).
 */
const WOLF_MODEL = require('../../assets/models/test_wolf.glb');

/**
 * Wraps the loaded GLTF in a `<group>` and spins it around Y axis per frame.
 * Using a group (instead of rotating the primitive directly) keeps the
 * original scene graph of the GLTF untouched.
 */
function RotatingModel() {
  const groupRef = useRef<Group>(null);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    g.rotation.y += 0.9 * delta;
  });

  return (
    <group ref={groupRef}>
      <Model source={WOLF_MODEL} />
    </group>
  );
}

/**
 * Declarative r3f scene powered by `@react-three/fiber/native`.
 *
 * Lifecycle / heat management:
 * - When the screen loses focus or the app is backgrounded, `frameloop` is
 *   switched to `"never"` so the render loop effectively pauses. r3f keeps
 *   the GL context warm so resuming is instant (no black flash).
 *
 * Suspense:
 * - `useGLTF` inside <Model> throws a Promise while loading. The Suspense
 *   boundary lives OUTSIDE <Canvas> (in ThreeTestScreen) so the loading UI is
 *   a regular RN <Text> and not a 3D object.
 *
 * Lighting:
 * - Ambient light softly lifts everything so nothing is pure black.
 * - Point light at [10, 10, 10] gives directional highlights to
 *   MeshStandardMaterial (the default material GLTF models use).
 */
export default function Scene3D({
  style,
  backgroundColor = '#1e1e1e',
}: Props) {
  const isFocused = useIsFocused();
  const [appActive, setAppActive] = useState(
    AppState.currentState === 'active'
  );

  useEffect(() => {
    const sub = AppState.addEventListener(
      'change',
      (state: AppStateStatus) => setAppActive(state === 'active')
    );
    return () => sub.remove();
  }, []);

  const shouldRender = isFocused && appActive;

  return (
    <Canvas
      style={style}
      frameloop={shouldRender ? 'always' : 'never'}
      gl={{
        antialias: false,
        powerPreference: 'low-power',
      }}
      camera={{ position: [0, 0, 3], fov: 60, near: 0.1, far: 100 }}
      onCreated={({ gl }) => {
        gl.setClearColor(backgroundColor, 1);
        // expo-gl / some Android GPUs: `getProgramInfoLog` / `getShaderInfoLog`
        // can return null. Three's WebGLProgram.onFirstUse calls `.trim()` on
        // those values when checkShaderErrors is true → crash on first draw.
        gl.debug.checkShaderErrors = false;
      }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />

      <RotatingModel />
    </Canvas>
  );
}

/** Kick off the GLTF download as early as possible to avoid a loading hitch. */
Scene3D.preload = () => {
  Model.preload(WOLF_MODEL);
};
