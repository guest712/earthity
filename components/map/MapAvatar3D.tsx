import { Canvas, useFrame } from '@react-three/fiber/native';
import { useIsFocused } from '@react-navigation/native';
import { Suspense, useEffect, useRef, useState } from 'react';
import {
  AppState,
  StyleSheet,
  View,
  type AppStateStatus,
  type ViewStyle,
} from 'react-native';
import type MapView from 'react-native-maps';
import { Box3, Vector3, type Group } from 'three';

import Model, { type ModelSource } from '../three/Model';

/**
 * Live r3f overlay positioned over a MapView. The model is anchored to a
 * geo-coordinate via `mapRef.pointForCoordinate(...)` and rotated by compass
 * heading. This is the foundation for full AR rendering of poly models in
 * the game world (creatures, pickups, etc.) — the same pattern scales up
 * by adding more models to this scene with their own coordinates.
 *
 * Why ortho camera:
 * - 1 world unit = 1 pixel (with `zoom=1`), so we can position the model
 *   directly using map screen coordinates without any projection math.
 *
 * Performance:
 * - We poll `pointForCoordinate` from `useFrame` (async, fire-and-forget).
 *   Latest value is written to a ref and applied to the group position on
 *   the next frame. Acceptable visual lag is ~1 frame on pan.
 * - Frame loop pauses when the screen is unfocused or the app is backgrounded.
 */
type Props = {
  mapRef: React.RefObject<MapView | null>;
  location: { latitude: number; longitude: number } | null;
  heading: number | null;
  modelSource: ModelSource;
  /** World-unit scale of the model. Tune to match desired marker size in px. */
  scale?: number;
  /**
   * Extra rotation in degrees to compensate for the model's "forward" axis.
   * GLTF spec defines -Z as forward; for a model authored to spec, 0 is correct.
   */
  headingOffsetDeg?: number;
  /**
   * Posing strategy:
   *  - "flat":    rotate +90° around X so the model lies on its back relative
   *               to the camera, presenting a top-down silhouette.
   *  - "upright": leave the model standing (Y is up); compass rotates around Y.
   * If omitted, auto-derived from `mapMode`.
   */
  pose?: 'flat' | 'upright';
  /** Used to auto-pick `pose` when not given: 2D → flat, 3D_Tilt → upright. */
  mapMode?: '2D' | '3D_Tilt';
  style?: ViewStyle;
};

/**
 * Three-level group hierarchy:
 *   anchorGroup → poseGroup → scaleGroup → <Model />
 *
 *   anchorGroup
 *     - position = screen coord of player (px, py, 0)
 *     - rotation = compass; axis depends on pose:
 *         flat    → rotate around Z (model lies in screen plane)
 *         upright → rotate around Y (world up)
 *   poseGroup
 *     - rotation.x = +PI/2 for flat, 0 for upright
 *     - position.y = vertical offset to put the model's bottom on the anchor
 *   scaleGroup
 *     - applies `scale` and contains the actual <Model />
 *
 * Why three levels: keeping compass and pose in separate groups avoids
 * Euler-order pitfalls (rotating an already-laid-flat model around Z would
 * tilt it sideways, which is exactly the bug we're fixing here).
 */
function FollowingModel({
  mapRef,
  location,
  heading,
  modelSource,
  scale,
  headingOffsetDeg,
  pose,
  size,
}: {
  mapRef: React.RefObject<MapView | null>;
  location: { latitude: number; longitude: number } | null;
  heading: number;
  modelSource: ModelSource;
  scale: number;
  headingOffsetDeg: number;
  pose: 'flat' | 'upright';
  size: { w: number; h: number };
}) {
  const anchorRef = useRef<Group>(null);
  const poseRef = useRef<Group>(null);
  const scaleRef = useRef<Group>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const inflightRef = useRef(false);

  // Bottom offset (in scaled world units) — measured once after the model loads.
  const [bottomOffset, setBottomOffset] = useState(0);
  const measuredRef = useRef(false);

  useFrame(() => {
    // ─── 1. measure model bbox once it's in the scene ──────────────────────
    if (!measuredRef.current && scaleRef.current) {
      const bbox = new Box3().setFromObject(scaleRef.current);
      const sz = new Vector3();
      bbox.getSize(sz);
      // Skip until the GLTF actually populated geometry (Suspense settled)
      if (sz.lengthSq() > 0) {
        // bbox.min.y is in world (post-scale) units. We want the model's
        // bottom (min.y) to sit at y=0 of the pose group, so we shift by -min.y.
        setBottomOffset(-bbox.min.y);
        measuredRef.current = true;
      }
    }

    // ─── 2. screen-coord poll (async fire-and-forget) ──────────────────────
    if (
      mapRef.current &&
      location &&
      size.w > 0 &&
      size.h > 0 &&
      !inflightRef.current &&
      typeof (mapRef.current as any).pointForCoordinate === 'function'
    ) {
      inflightRef.current = true;
      (mapRef.current as any)
        .pointForCoordinate(location)
        .then((p: { x: number; y: number }) => {
          posRef.current = {
            x: p.x - size.w / 2,
            y: -(p.y - size.h / 2),
          };
        })
        .catch(() => {})
        .finally(() => {
          inflightRef.current = false;
        });
    }

    // ─── 3. apply transforms ───────────────────────────────────────────────
    const a = anchorRef.current;
    const ps = poseRef.current;
    if (!a || !ps) return;

    a.position.set(posRef.current.x, posRef.current.y, 0);

    const headingRad = ((heading + headingOffsetDeg) * Math.PI) / 180;
    if (pose === 'flat') {
      // Compass rotates the (laid-flat) model in the screen plane.
      a.rotation.set(0, 0, -headingRad);
      ps.rotation.set(Math.PI / 2, 0, 0);
      // For top-down view the "ground" is the screen plane → no Y offset.
      ps.position.set(0, 0, 0);
    } else {
      // Upright: compass = rotation around world up (Y).
      a.rotation.set(0, -headingRad, 0);
      ps.rotation.set(0, 0, 0);
      // Lift so the model's bottom (its feet) lands on the anchor point.
      ps.position.set(0, bottomOffset, 0);
    }
  });

  return (
    <group ref={anchorRef}>
      <group ref={poseRef}>
        <group ref={scaleRef} scale={scale}>
          <Model source={modelSource} />
        </group>
      </group>
    </group>
  );
}

export default function MapAvatar3D({
  mapRef,
  location,
  heading,
  modelSource,
  scale = 30,
  headingOffsetDeg = 0,
  pose,
  mapMode,
  style,
}: Props) {
  const effectivePose: 'flat' | 'upright' =
    pose ?? (mapMode === '3D_Tilt' ? 'upright' : 'flat');
  const isFocused = useIsFocused();
  const [appActive, setAppActive] = useState(
    AppState.currentState === 'active'
  );
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const sub = AppState.addEventListener(
      'change',
      (state: AppStateStatus) => setAppActive(state === 'active')
    );
    return () => sub.remove();
  }, []);

  const shouldRender = isFocused && appActive && location != null;

  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, style]}
      onLayout={(e) =>
        setSize({
          w: e.nativeEvent.layout.width,
          h: e.nativeEvent.layout.height,
        })
      }
    >
      <Canvas
        style={{ flex: 1, backgroundColor: 'transparent' }}
        frameloop={shouldRender ? 'always' : 'never'}
        gl={{
          alpha: true,
          antialias: false,
          powerPreference: 'low-power',
        }}
        orthographic
        camera={{
          position: [0, 0, 100],
          zoom: 1,
          near: 0.1,
          far: 1000,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          // Same workaround as Scene3D — some Android GPUs return null from
          // getProgramInfoLog/getShaderInfoLog and three's `.trim()` crashes.
          gl.debug.checkShaderErrors = false;
        }}
      >
        {/*
          Lighting for a small top-down map icon. Goals:
          - never go fully black (ambient + hemi)
          - preserve readable shading (directional from camera-ish angle)
          - intensities tuned for MeshStandardMaterial which GLTF uses
        */}
        <ambientLight intensity={1.2} />
        <hemisphereLight args={['#ffffff', '#445566', 0.8]} />
        <directionalLight position={[0, 0, 100]} intensity={2.0} />
        <directionalLight position={[50, 80, 60]} intensity={1.5} />
        <Suspense fallback={null}>
          <FollowingModel
            mapRef={mapRef}
            location={location}
            heading={heading ?? 0}
            modelSource={modelSource}
            scale={scale}
            headingOffsetDeg={headingOffsetDeg}
            pose={effectivePose}
            size={size}
          />
        </Suspense>
      </Canvas>
    </View>
  );
}

MapAvatar3D.preload = (source: ModelSource) => {
  Model.preload(source);
};
