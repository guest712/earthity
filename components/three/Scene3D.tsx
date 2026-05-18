import { Canvas, useFrame } from '@react-three/fiber/native';
import { Suspense, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus, type ViewStyle } from 'react-native';
import type { Group } from 'three';

import Model from './Model';

/** true → только примитивный куб (без GLB, без Bounds). Убедиться в WebGL на устройстве, затем false. */
const SIMPLE_WEBGL_PROBE = false;

type Props = {
  style?: ViewStyle;
  /** Clear color for the framebuffer. */
  backgroundColor?: string;
};

/**
 * Source of the test model. Kept as a module-scope `require` so it's resolved
 * once and can be preloaded (see ThreeTestScreen). Должно совпадать с
 * PLAYER_MAP_MODEL в `app/(app)/(tabs)/index.tsx` — `three-test` нужен как
 * изолированная проверка того, что AR-волк на карте грузится из того же GLB.
 */
const WOLF_MODEL = require('../../assets/models/test_wolf1.glb');

/**
 * Минимальная проверка: expo-gl + r3f рисуют меш без useGLTF/drei Bounds.
 */
function SpinningProbeCube() {
  const groupRef = useRef<Group>(null);
  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    g.rotation.x += 0.35 * delta;
    g.rotation.y += 0.9 * delta;
  });
  return (
    <group ref={groupRef}>
      <mesh>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshBasicMaterial color="#ff7b2e" />
      </mesh>
    </group>
  );
}

/**
 * GLB уже в «человеческих» единицах (bbox ≈ 2 по высоте — см. debugPlayerGltf).
 * Не путать с AR-картой: там ortho и `scale≈30` в **пикселях**, не те же единицы.
 * Большой множитель (42/100) при z=5 помещает камеру *внутрь* меша → пустой кадр.
 */
const TEST_SCENE_WOLF_SCALE = 1;

function RotatingModel() {
  const groupRef = useRef<Group>(null);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    g.rotation.y += 0.9 * delta;
  });

  const s = TEST_SCENE_WOLF_SCALE;
  return (
    <group ref={groupRef} position={[0, -0.6, 0]}>
      <group scale={[s, s, s]}>
        {/*
          Без skinAnimation*: для GLB без треков нет смешателя/fade idle↔walk.
          `useGLTF` должен висеть под <Suspense> **внутри** <Canvas> (см. ниже).
        */}
        <Model source={WOLF_MODEL} />
      </group>
    </group>
  );
}

/**
 * Declarative r3f scene powered by `@react-three/fiber/native`.
 *
 * Lifecycle / heat management:
 * - When the app is backgrounded, `frameloop` is `"never"`. (Tab focus is not
 *   used here: `useIsFocused` was starving the test screen in some layouts.)
 *
 * Suspense:
 * - `useGLTF` суспендит дерево Fiber **внутри** Canvas → границу ставим **здесь**,
 *   снаружи `<Canvas>` (в ThreeTestScreen) подвисание часто не ловится — пустой кадр.
 * - drei `Bounds` убраны: при проблемном bbox кадр оставался пустым при рабочем probe-кубе.
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

  const shouldRender = appActive;

  return (
    <Canvas
      style={style}
      frameloop={shouldRender ? 'always' : 'never'}
      gl={{
        antialias: false,
        powerPreference: 'low-power',
      }}
      camera={{ position: [0, 0.25, 6], fov: 50, near: 0.01, far: 500 }}
      onCreated={({ gl }) => {
        gl.setClearColor(backgroundColor, 1);
        // expo-gl / some Android GPUs: `getProgramInfoLog` / `getShaderInfoLog`
        // can return null. Three's WebGLProgram.onFirstUse calls `.trim()` on
        // those values when checkShaderErrors is true → crash on first draw.
        gl.debug.checkShaderErrors = false;
      }}
    >
      <ambientLight intensity={0.85} />
      <hemisphereLight args={['#ffffff', '#444444', 0.6]} />
      <directionalLight position={[4, 6, 4]} intensity={1.25} />
      <pointLight position={[10, 10, 10]} intensity={0.95} />
      <Suspense fallback={null}>
        {SIMPLE_WEBGL_PROBE ? <SpinningProbeCube /> : <RotatingModel />}
      </Suspense>
    </Canvas>
  );
}

/** Kick off the GLTF download as early as possible to avoid a loading hitch. */
Scene3D.preload = () => {
  if (SIMPLE_WEBGL_PROBE) return;
  Model.preload(WOLF_MODEL);
};
