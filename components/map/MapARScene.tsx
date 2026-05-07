import { Canvas, useFrame, useThree } from '@react-three/fiber/native';
import { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  AppState,
  Dimensions,
  Platform,
  StyleSheet,
  View,
  type AppStateStatus,
  type ViewStyle,
} from 'react-native';
import type MapView from 'react-native-maps';
import {
  Box3,
  DoubleSide,
  OrthographicCamera,
  Vector3,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
} from 'three';

/**
 * R3F default ortho bounds are roughly [-1,1]; our scene uses ~1 GL unit ≈ 1 px (scale groups up to tens).
 * Without matching the overlay pixel size to the projection, the wolf is clipped and looks "missing".
 */
function AlignOrthoToOverlayPx({ width, height }: { width: number; height: number }) {
  const cam = useThree((s) => s.camera as OrthographicCamera);

  useLayoutEffect(() => {
    const w = Math.max(1, width);
    const h = Math.max(1, height);
    cam.left = -w / 2;
    cam.right = w / 2;
    cam.top = h / 2;
    cam.bottom = -h / 2;
    cam.near = 0.1;
    cam.far = 2000;
    cam.position.set(0, 0, 100);
    cam.updateProjectionMatrix();
  }, [cam, width, height]);

  return null;
}

import { getDistance } from '../../lib/shared/game-utils';
import Model, {
  type ModelSource,
  type SkinLocomotionHints,
} from '../three/Model';

/** Hysteresis band for locomotion idle/walk flip (must be ENTER > EXIT). */
const LOC_WALK_BLEND_ENTER = 0.42;
const LOC_WALK_BLEND_EXIT = 0.26;

/** Player AR debug (inner transform + `Model.debugPlayerGltf`). Must stay `false` for normal map. */
const DEBUG_PLAYER_AR_MODEL = false;

/**
 * MapARScene — generic AR overlay over a `react-native-maps` MapView.
 *
 * One transparent r3f Canvas hosts ALL AR-objects (player, creatures, drops,
 * landmarks). Each `ARObject` is geo-anchored: its on-screen position is
 * resolved via `mapRef.pointForCoordinate(...)` every frame, then mapped to
 * ortho world units (1 unit = 1 px).
 *
 * Why a single scene with a list (vs many `MapAvatar3D` instances):
 *  - One GL context, one render loop, one set of lights.
 *  - Cheaper to scale to dozens of objects.
 *  - All AR entities share the same camera/projection, so their relative
 *    positions on screen stay coherent.
 *
 * Coordinate mapping:
 *  - Map screen point (x, y) in pixels (origin = top-left of overlay view).
 *  - World point (X, Y, 0) in r3f, with X = x - w/2 and Y = -(y - h/2).
 *    This makes "screen up" equal to "+Y world" (ortho camera looks down -Z).
 *
 * Posing:
 *  - "flat":    +90° around X — model lies in screen plane, top-down silhouette.
 *               Compass rotates around Z (in-screen-plane rotation).
 *  - "upright": stand the model on its feet. Compass rotates around Y (world up).
 *  - "auto":    use 'flat' for mapMode='2D', 'upright' for '3D_Tilt'.
 *
 * Ground anchoring:
 *  - For 'upright' pose we lift the model so its bbox.min.y sits at y=0 of the
 *    pose group → the model's feet land exactly on the geo-anchor point.
 */

export type ARObjectPose = 'flat' | 'upright' | 'auto';

export type ARObject = {
  id: string;
  /** Geo position of the object's anchor (= its bottom for upright pose). */
  coordinate: { latitude: number; longitude: number };
  modelSource: ModelSource;
  /** World-unit scale (1 unit = 1 px in this scene's ortho camera). */
  scale?: number;
  /** Heading in degrees (0 = north). null/undefined → no rotation. */
  heading?: number | null;
  /**
   * Compensation for non-standard "forward" axis in source GLB
   * (GLTF spec defines -Z as forward; many Blender exports differ).
   */
  headingOffsetDeg?: number;
  /** See ARObjectPose. Default 'auto'. */
  pose?: ARObjectPose;
  /** Show a pulsing proximity ring beneath this object. */
  pulseRing?: boolean;
  /**
   * 0 = no spawn nearby, 1.0 = spawn exactly at interaction-distance
   * boundary, > 1.0 = spawn is within interaction range.
   * Controls ring color and pulse speed.
   */
  nearestSpawnProximity?: number;
  /**
   * Cross-fade idle ↔ walk from the GLB when the geo coordinate changes
   * with sufficient speed (GPS-derived; avoids walk during map pan alone).
   */
  locomotion?: boolean;
  /** Match GLTF clip names ahead of defaults (substring match supported). */
  locomotionClipHints?: SkinLocomotionHints;
  /**
   * Play idle/walk without cross-fade (stopAll + weight 1). For dev diagnosis;
   * see Model `skinLocomotionHardSwitch`.
   */
  locomotionHardSwitch?: boolean;
  /**
   * After repeated failures of native `pointForCoordinate`, anchor this object at
   * overlay center `(0,0)` in scene space so it stays visible (approximate geo).
   * Use for the player; keep false for map props that must match exact coords.
   */
  fallbackProjectionCenter?: boolean;
};

type Props = {
  mapRef: React.RefObject<MapView | null>;
  objects: ARObject[];
  mapMode?: '2D' | '3D_Tilt';
  /**
   * Counter that the parent increments on every map `onRegionChange[Complete]`.
   * AR objects re-query their screen position via native `pointForCoordinate`
   * only when this tick advances (or when the object's coordinate changes),
   * so a still map costs zero bridge calls per frame.
   */
  regionTickRef?: React.RefObject<number>;
  style?: ViewStyle;
};

/**
 * Pulsing ring rendered beneath the player model.
 *
 * pose='flat'   (2D top-down) → ring in XY plane, appears as a circle = disc on map ✓
 * pose='upright' (3D tilt)    → same ring squished on Y (scaleY≈0.28) to simulate
 *                               perspective foreshortening, looks parallel to ground ✓
 *
 * proximity:
 *   0   – no spawn nearby   → dim green, slow pulse (2.8 s/cycle)
 *   ≥ 1 – within range      → bright lime, faster (1.5 s/cycle), second ring
 */
function PulseRing({
  proximity = 0,
  pose = 'flat',
}: {
  proximity?: number;
  pose?: 'flat' | 'upright';
}) {
  const ringRef = useRef<Mesh>(null);
  const matRef = useRef<MeshBasicMaterial>(null);
  const ring2Ref = useRef<Mesh>(null);
  const mat2Ref = useRef<MeshBasicMaterial>(null);
  // Randomise starting phase so multiple rings on screen don't pulse in sync.
  const timeRef = useRef(Math.random());

  const inRange = proximity >= 1;

  // In 3D-tilt / upright mode, squish the ring on Y to mimic a disc lying on
  // a ~45° tilted ground plane (approximate; we don't have the exact tilt).
  const groundScaleY = pose === 'upright' ? 0.28 : 1;

  useFrame((_, delta) => {
    const speed = inRange ? 1.5 : 2.8;
    timeRef.current = (timeRef.current + delta / speed) % 1;
    const t = timeRef.current;

    if (ringRef.current && matRef.current) {
      const s = 1 + t * 0.7;          // expands to 1.7× (was 2.2×, less wild)
      ringRef.current.scale.set(s, s * groundScaleY, 1);
      matRef.current.opacity = (inRange ? 0.7 : 0.38) * (1 - t);
      matRef.current.color.set(inRange ? '#57FF7E' : '#2ECC71');
    }

    if (ring2Ref.current && mat2Ref.current) {
      const t2 = (t + 0.5) % 1;
      const s2 = 1 + t2 * 0.7;
      ring2Ref.current.scale.set(s2, s2 * groundScaleY, 1);
      mat2Ref.current.opacity = 0.5 * (1 - t2);
      ring2Ref.current.visible = inRange;
    }
  });

  return (
    <group position={[0, 0, -1]}>
      <mesh ref={ringRef}>
        <ringGeometry args={[15, 20, 52]} />
        <meshBasicMaterial
          ref={matRef}
          color="#2ECC71"
          transparent
          opacity={0.38}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>
      <mesh ref={ring2Ref} visible={false}>
        <ringGeometry args={[15, 20, 52]} />
        <meshBasicMaterial
          ref={mat2Ref}
          color="#57FF7E"
          transparent
          opacity={0}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>
    </group>
  );
}

function resolvePose(pose: ARObjectPose | undefined, mapMode: '2D' | '3D_Tilt' | undefined): 'flat' | 'upright' {
  if (pose === 'flat' || pose === 'upright') return pose;
  return mapMode === '3D_Tilt' ? 'upright' : 'flat';
}

/**
 * Renders a single AR object: anchor → pose → scale → <Model />.
 *
 *   anchorGroup  — screen position; rotation axis depends on pose
 *   poseGroup    — lay-flat tilt + ground offset
 *   scaleGroup   — uniform scale; bbox is measured here (post-scale)
 *
 * useFrame loop:
 *   0) Locomotion blend (updates skinAnimationRef before child <Model>/mixer).
 *   1) Measure bbox once when the GLTF has populated geometry.
 *   2) Async-poll `pointForCoordinate` (fire-and-forget).
 *   3) Apply transforms based on the latest known screen position + heading.
 */
function ARNode({
  object,
  mapRef,
  mapMode,
  regionTickRef,
  size,
}: {
  object: ARObject;
  mapRef: React.RefObject<MapView | null>;
  mapMode: '2D' | '3D_Tilt' | undefined;
  regionTickRef?: React.RefObject<number>;
  size: { w: number; h: number };
}) {
  const anchorRef = useRef<Group>(null);
  const poseRef = useRef<Group>(null);
  const scaleRef = useRef<Group>(null);
  // posRef stays null until the first successful native projection. Until
  // then we keep the model hidden so it never flashes at screen-center (which
  // visually looks like the model is "stuck" to whatever marker is there).
  const posRef = useRef<{ x: number; y: number } | null>(null);
  const inflightRef = useRef(false);
  const measuredRef = useRef(false);

  const walkBlendRef = useRef(0);
  const locomotionPrevGeoRef = useRef<{
    lat: number;
    lng: number;
    t: number;
  } | null>(null);
  const locomotionAnimRef = useRef<'idle' | 'walk'>('idle');
  /** Wall-clock stamp of last frame where geo jump implied walking speed. Keeps blend high between React updates (~GPS interval / dev sim ticks). */
  const lastWalkSignalAtRef = useRef<number | null>(null);

  // Tick + coordinate captured at the time of the last successful poll.
  // Used to decide whether a new `pointForCoordinate` request is needed.
  const lastTickRef = useRef(-1);
  const lastCoordRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastSizeRef = useRef({ w: 0, h: 0 });
  const projErrLoggedRef = useRef(false);

  const [bottomOffset, setBottomOffset] = useState(0);

  const scale = object.scale ?? 30;
  const headingOffsetDeg = object.headingOffsetDeg ?? 0;
  const pose = resolvePose(object.pose, mapMode);
  const heading = object.heading ?? 0;
  const coordinate = object.coordinate;
  const modelSource = object.modelSource;

  const playerArDebugLoggedRef = useRef(false);
  useEffect(() => {
    if (object.id !== 'player' || playerArDebugLoggedRef.current) return;
    playerArDebugLoggedRef.current = true;
    console.log('[AR DEBUG] player node rendered');
  }, [object.id]);

  // If the same ARNode (same key/id) ever receives a different GLB, force a
  // fresh bbox measurement — otherwise the upright pose would keep using the
  // previous model's bottom offset and the new mesh would sink/float.
  useEffect(() => {
    measuredRef.current = false;
    setBottomOffset(0);
    locomotionPrevGeoRef.current = null;
    walkBlendRef.current = 0;
    locomotionAnimRef.current = 'idle';
    lastWalkSignalAtRef.current = null;
    posRef.current = null;
    lastCoordRef.current = null;
    lastTickRef.current = -1;
  }, [modelSource]);

  useFrame((_, delta) => {
    /** Player fallback: overlay center immediately once layout exists. Native projection overwrites when it works — avoids deadlock when map ref / API is flaky. */
    if (
      object.fallbackProjectionCenter &&
      posRef.current == null &&
      size.w > 0 &&
      size.h > 0
    ) {
      posRef.current = { x: 0, y: 0 };
    }

    if (object.locomotion) {
      const now =
        typeof globalThis.performance !== 'undefined'
          ? globalThis.performance.now()
          : Date.now();
      const cur = {
        lat: coordinate.latitude,
        lng: coordinate.longitude,
      };
      const prev = locomotionPrevGeoRef.current;

      if (!prev) {
        locomotionPrevGeoRef.current = { lat: cur.lat, lng: cur.lng, t: now };
      } else if (prev.lat !== cur.lat || prev.lng !== cur.lng) {
        const d = getDistance(prev.lat, prev.lng, cur.lat, cur.lng);
        const dtMs = Math.max(Math.min(now - prev.t, 30_000), 80);
        const speed = d / (dtMs / 1000);
        if (speed > 0.28 && d > 0.55) {
          lastWalkSignalAtRef.current = now;
        }
        locomotionPrevGeoRef.current = { lat: cur.lat, lng: cur.lng, t: now };
      }

      const HOLD_WALK_SIGNAL_MS = 750;
      const moveTarget =
        lastWalkSignalAtRef.current !== null &&
        now - lastWalkSignalAtRef.current < HOLD_WALK_SIGNAL_MS
          ? 1
          : 0;

      const rate = Math.min(delta * 8, 0.55);
      walkBlendRef.current +=
        (moveTarget - walkBlendRef.current) * rate;

      const mode = locomotionAnimRef.current;
      if (mode === 'idle') {
        if (walkBlendRef.current >= LOC_WALK_BLEND_ENTER) {
          locomotionAnimRef.current = 'walk';
        }
      } else if (walkBlendRef.current <= LOC_WALK_BLEND_EXIT) {
        locomotionAnimRef.current = 'idle';
      }
    } else {
      walkBlendRef.current = 0;
      locomotionAnimRef.current = 'idle';
      locomotionPrevGeoRef.current = null;
      lastWalkSignalAtRef.current = null;
    }

    if (!measuredRef.current && scaleRef.current) {
      const bbox = new Box3().setFromObject(scaleRef.current);
      const sz = new Vector3();
      bbox.getSize(sz);
      if (sz.lengthSq() > 0) {
        setBottomOffset(-bbox.min.y);
        measuredRef.current = true;
      }
    }

    // ─── decide whether to refresh screen position via native projection ──
    const currentTick = regionTickRef?.current ?? 0;
    const coordChanged =
      !lastCoordRef.current ||
      lastCoordRef.current.lat !== coordinate.latitude ||
      lastCoordRef.current.lng !== coordinate.longitude;
    const sizeChanged =
      lastSizeRef.current.w !== size.w || lastSizeRef.current.h !== size.h;
    const needsRefresh =
      currentTick !== lastTickRef.current || coordChanged || sizeChanged;

    if (
      needsRefresh &&
      !inflightRef.current &&
      mapRef.current &&
      size.w > 0 &&
      size.h > 0 &&
      typeof (mapRef.current as any).pointForCoordinate === 'function'
    ) {
      inflightRef.current = true;
      const requestedCoord = {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
      };
      const requestedTick = currentTick;
      const requestedSize = { w: size.w, h: size.h };
      (mapRef.current as any)
        .pointForCoordinate(requestedCoord)
        .then((p: { x: number; y: number }) => {
          projErrLoggedRef.current = false;
          posRef.current = {
            x: p.x - requestedSize.w / 2,
            y: -(p.y - requestedSize.h / 2),
          };
          lastTickRef.current = requestedTick;
          lastCoordRef.current = {
            lat: requestedCoord.latitude,
            lng: requestedCoord.longitude,
          };
          lastSizeRef.current = requestedSize;
        })
        .catch((err: unknown) => {
          if (__DEV__ && !projErrLoggedRef.current) {
            projErrLoggedRef.current = true;
            console.warn('[MapARScene] pointForCoordinate failed:', err);
          }
        })
        .finally(() => {
          inflightRef.current = false;
        });
    }

    const a = anchorRef.current;
    const ps = poseRef.current;
    const sc = scaleRef.current;
    if (!a || !ps || !sc) return;

    // Keep the model hidden until we have a real projected position. This
    // prevents a single-frame flash at overlay-center on first mount or
    // during 3D-tilt camera transitions before the first native projection
    // resolves — otherwise it visually looks like the player is glued to
    // whatever marker happens to sit near screen-center.
    if (posRef.current == null) {
      sc.visible = false;
      return;
    }
    sc.visible = true;

    a.position.set(posRef.current.x, posRef.current.y, 0);

    const headingRad = ((heading + headingOffsetDeg) * Math.PI) / 180;
    if (pose === 'flat') {
      a.rotation.set(0, 0, -headingRad);
      ps.rotation.set(Math.PI / 2, 0, 0);
      ps.position.set(0, 0, 0);
    } else {
      a.rotation.set(0, -headingRad, 0);
      ps.rotation.set(0, 0, 0);
      ps.position.set(0, bottomOffset, 0);
    }
  });

  return (
    <group ref={anchorRef}>
      {object.pulseRing && (
        <PulseRing proximity={object.nearestSpawnProximity ?? 0} pose={pose} />
      )}
      <group ref={poseRef}>
        <group ref={scaleRef} scale={scale}>
          <Model
            source={object.modelSource}
            {...(object.locomotion
              ? {
                  skinAnimationRef: locomotionAnimRef,
                  skinClipHints: object.locomotionClipHints,
                  skinLocomotionHardSwitch: object.locomotionHardSwitch,
                }
              : {
                  skinAnimation: 'idle' as const,
                  skinClipHints: object.locomotionClipHints,
                })}
          />
          {object.id === 'player' && (
            <mesh position={[0, 0, 10]} scale={[20, 20, 20]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshBasicMaterial color="red" />
            </mesh>
          )}
        </group>
      </group>
    </group>
  );
}

export default function MapARScene({ mapRef, objects, mapMode, regionTickRef, style }: Props) {
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const [size, setSize] = useState(() => {
    const { width } = Dimensions.get('window');
    return { w: Math.max(160, width - 40), h: 220 };
  });

  useEffect(() => {
    const sub = AppState.addEventListener(
      'change',
      (state: AppStateStatus) => setAppActive(state === 'active')
    );
    return () => sub.remove();
  }, []);

  const runCanvasLoop = appActive && objects.length > 0;

  return (
    <View
      pointerEvents="none"
      collapsable={false}
      renderToHardwareTextureAndroid={Platform.OS === 'android'}
      style={[
        StyleSheet.absoluteFill,
        {
          zIndex: 16,
          elevation: Platform.OS === 'android' ? 28 : 16,
        },
        style,
      ]}
      onLayout={(e) =>
        setSize((prev) => ({
          w: Math.max(
            1,
            e.nativeEvent.layout.width > 0 ? e.nativeEvent.layout.width : prev.w
          ),
          h: Math.max(
            1,
            e.nativeEvent.layout.height > 0 ? e.nativeEvent.layout.height : prev.h
          ),
        }))
      }
    >
      <Canvas
        style={{ flex: 1, backgroundColor: 'transparent' }}
        frameloop={runCanvasLoop ? 'always' : 'never'}
        gl={{
          alpha: true,
          antialias: false,
          powerPreference: 'low-power',
        }}
        orthographic
        camera={{ position: [0, 0, 100], zoom: 1, near: 0.1, far: 1000 }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          // Some Android GPUs return null from getProgramInfoLog/getShaderInfoLog;
          // three's `.trim()` would crash on first draw — see Scene3D for the
          // same workaround.
          gl.debug.checkShaderErrors = false;
        }}
      >
        <AlignOrthoToOverlayPx width={size.w} height={size.h} />
        <ambientLight intensity={1.2} />
        <hemisphereLight args={['#ffffff', '#445566', 0.8]} />
        <directionalLight position={[0, 0, 100]} intensity={2.0} />
        <directionalLight position={[50, 80, 60]} intensity={1.5} />
        {objects.map((obj) => (
          // Per-object Suspense: while one model loads, all the others stay
          // visible. A single shared boundary would hide the entire scene
          // every time a new GLB enters the cache.
          <Suspense key={obj.id} fallback={null}>
            <ARNode
              object={obj}
              mapRef={mapRef}
              mapMode={mapMode}
              regionTickRef={regionTickRef}
              size={size}
            />
          </Suspense>
        ))}
      </Canvas>
    </View>
  );
}

/** Preload one or many GLB sources to avoid first-frame loading hitches. */
MapARScene.preload = (sources: ModelSource | ModelSource[]) => {
  const list = Array.isArray(sources) ? sources : [sources];
  for (const s of list) Model.preload(s);
};
