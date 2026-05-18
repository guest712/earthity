import { Asset } from 'expo-asset';
import { useGLTF, Clone } from '@react-three/drei/native';
import { useFrame } from '@react-three/fiber/native';
import type { ThreeElements } from '@react-three/fiber/native';
import type { MutableRefObject } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AnimationClip,
  AnimationMixer,
  Box3,
  LoopRepeat,
  Mesh,
  SkinnedMesh,
  Vector3,
  type AnimationAction,
  type KeyframeTrack,
  type Object3D,
  type Group as ThreeGroup,
} from 'three';
import { clone as cloneSkinnedScene } from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { GLTF } from 'three-stdlib';

function disableSkinnedFrustumCull(root: Object3D): void {
  root.traverse((obj) => {
    if (obj instanceof SkinnedMesh) obj.frustumCulled = false;
  });
}

function logGltfMeshStats(scene: Object3D, tag: string): void {
  let meshCount = 0;
  let skinnedCount = 0;
  scene.traverse((obj) => {
    if (obj instanceof SkinnedMesh) {
      skinnedCount += 1;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      console.log(`[${tag}] SkinnedMesh`, obj.name || '(unnamed)', {
        visible: obj.visible,
        bones: obj.skeleton?.bones.length ?? 0,
        materials: mats.map((m) => m?.type ?? 'none'),
      });
    } else if (obj instanceof Mesh) {
      meshCount += 1;
    }
  });
  console.log(`[${tag}] mesh stats`, { meshCount, skinnedCount });
}

/**
 * glTF merges sometimes produce `.undefined` suffixes while keeping the same track order/count as Idle.
 * Copy the property suffix from the parallel Idle track (`bone.idleSuffix` keeps `bone` from clip).
 *
 * Drops any remaining unreadable tracks (avoids PropertyBinding throws that break RN r3f).
 */
function sanitizeLocomotionClip(
  clip: AnimationClip,
  referenceClip?: AnimationClip | null
): AnimationClip {
  const parallelRef =
    referenceClip?.tracks?.length &&
    referenceClip.tracks.length === clip.tracks.length
      ? referenceClip.tracks
      : null;

  const rebuilt: KeyframeTrack[] = [];
  const droppedLabels: string[] = [];

  for (let i = 0; i < clip.tracks.length; i++) {
    const track = clip.tracks[i];
    let name = track.name;
    let dot = name.lastIndexOf('.');

    if (parallelRef && dot > 0) {
      let propPart = name.slice(dot + 1);
      if (!propPart || propPart === 'undefined' || propPart === 'null') {
        const refNm = parallelRef[i]?.name ?? '';
        const refDot = refNm.lastIndexOf('.');
        if (refDot > 0 && refNm.length > refDot + 1) {
          const suffix = refNm.slice(refDot);
          const base = name.slice(0, dot);
          name = `${base}${suffix}`;
          dot = name.lastIndexOf('.');
          propPart = name.slice(dot + 1);
        }
      }
    }

    if (dot <= 0) {
      droppedLabels.push(track.name);
      continue;
    }
    const propTail = name.slice(dot + 1);
    if (
      !propTail ||
      propTail === 'undefined' ||
      propTail === 'null' ||
      !(
        propTail === 'position' ||
        propTail === 'quaternion' ||
        propTail === 'rotation' ||
        propTail === 'scale' ||
        propTail === 'morphTargetInfluences' ||
        propTail === 'visible'
      )
    ) {
      droppedLabels.push(track.name);
      continue;
    }

    if (name !== track.name) {
      const t = track.clone();
      t.name = name;
      rebuilt.push(t);
    } else {
      rebuilt.push(track);
    }
  }

  if (
    droppedLabels.length === 0 &&
    rebuilt.length === clip.tracks.length &&
    rebuilt.every((t, idx) => t === clip.tracks[idx])
  ) {
    return clip;
  }

  if (__DEV__ && droppedLabels.length > 0) {
    console.warn(
      `[Model] clip "${clip.name}": dropped ${droppedLabels.length} bad track(s)`,
      droppedLabels.slice(0, 8),
      droppedLabels.length > 8 ? '…' : ''
    );
  }

  if (rebuilt.length === 0) {
    console.warn(
      `[Model] clip "${clip.name}" had no usable tracks after sanitize — playback disabled`
    );
    return new AnimationClip(clip.name, clip.duration, []);
  }

  return new AnimationClip(clip.name, clip.duration, rebuilt);
}

export type ModelSource = number | string;

export type SkinLocomotionHints = {
  idle?: string[];
  walk?: string[];
};

type Props = ThreeElements['group'] & {
  source: ModelSource;
  skinAnimation?: 'idle' | 'walk';
  skinAnimationRef?: MutableRefObject<'idle' | 'walk'>;
  skinClipHints?: SkinLocomotionHints;
  /**
   * Dev / isolate mixer: stop all actions then play only idle or walk at weight 1 (no fade).
   * Helps tell broken Walk tracks / asset issues from crossfade quirks.
   */
  skinLocomotionHardSwitch?: boolean;
  /** Temporary AR debug: log GLTF scene / anims / bbox. */
  debugPlayerGltf?: boolean;
  /**
   * r3f-native: `cloneSkinnedScene` + `<primitive>` не рисует некоторые skinned GLB;
   * `<Clone>` из drei согласован с reconciler. По умолчанию включён.
   */
  useDreiClone?: boolean;
};

const DEFAULT_IDLE_NAMES = [
  'Idle',
  'idle',
  'Armature|Idle',
  'Armature|idle',
  'Scene',
];

const DEFAULT_WALK_NAMES = [
  'Walk',
  'walk',
  'Walking',
  'walking',
  'Armature|Walk',
];

const IDLE_NAME_RES = [/idle/i, /rest/i, /\bstand\b/i, /breath/i];
const WALK_NAME_RES = [/walk/i, /run/i, /jog/i, /locomot/i, /stride/i, /cycle/i];

function firstClipMatchingNames(
  anims: readonly AnimationClip[],
  names: readonly string[]
): AnimationClip | null {
  for (const n of names) {
    const low = n.toLowerCase();
    const exact = anims.find((a) => a.name === n);
    if (exact) return exact;
    const sub = anims.find((a) => a.name.toLowerCase().includes(low));
    if (sub) return sub;
  }
  return null;
}

function firstClipMatchingPatterns(
  anims: readonly AnimationClip[],
  patterns: readonly RegExp[]
): AnimationClip | null {
  for (const re of patterns) {
    const hit = anims.find((a) => re.test(a.name));
    if (hit) return hit;
  }
  return null;
}

function resolveLocomotionClips(
  anims: readonly AnimationClip[],
  idleHints: readonly string[],
  walkHints: readonly string[]
): { idle: AnimationClip | null; walk: AnimationClip | null } {
  if (anims.length === 0) return { idle: null, walk: null };

  const idle =
    firstClipMatchingNames(anims, idleHints) ??
    firstClipMatchingPatterns(anims, IDLE_NAME_RES) ??
    anims[0] ??
    null;

  const walk =
    firstClipMatchingNames(anims, walkHints) ??
    firstClipMatchingPatterns(anims, WALK_NAME_RES) ??
    anims.find((c) => c !== idle) ??
    idle;

  return { idle, walk };
}

/** In r3f lower useFrame priority runs earlier; ARNode is 0 — we use 8 so mixer runs after locomotionAnimRef updates. */
const SKIN_MIXER_PRIORITY = 8;

/**
 * После онбординга `<HomeScreen>` перемонтируется, и `<ModelFromBundledModule>` создаётся заново.
 * Без модульного кэша его `useState<string|null>(null)` каждый раз снова уходит в `null`,
 * а второй `downloadAsync()` иногда «теряется» (видно по логам: первый цикл проигрывает Idle/Walk,
 * после перемонтажа `idleClip: null` и больше ничего). Кэшируем uri синхронно по moduleId,
 * чтобы повторные маунты получали готовое значение в первом же рендере (без Suspense-провала).
 */
const BUNDLED_URI_CACHE = new Map<number, string>();
const BUNDLED_URI_PENDING = new Map<number, Promise<string>>();

function getCachedBundledUri(moduleId: number): string | null {
  return BUNDLED_URI_CACHE.get(moduleId) ?? null;
}

function bundledModelModuleToUri(moduleId: number): Promise<string> {
  const cached = BUNDLED_URI_CACHE.get(moduleId);
  if (cached) return Promise.resolve(cached);
  const pending = BUNDLED_URI_PENDING.get(moduleId);
  if (pending) return pending;

  const p = (async () => {
    const asset = Asset.fromModule(moduleId);
    await asset.downloadAsync();
    const u = asset.localUri ?? asset.uri;
    if (!u || typeof u !== 'string') {
      throw new Error('[Model] Bundled GLB has no localUri/uri — check metro assetExts.');
    }
    BUNDLED_URI_CACHE.set(moduleId, u);
    return u;
  })().finally(() => {
    BUNDLED_URI_PENDING.delete(moduleId);
  });

  BUNDLED_URI_PENDING.set(moduleId, p);
  return p;
}

type UriProps = Omit<Props, 'source'> & { uri: string };

/**
 * `drei`'s useGLTF(path) defaults attach DRACO (remote WASM from gstatic) + Meshopt.
 * On RN that often breaks or never finishes parsing — bundled GLBs load fine without both.
 */
const GLTF_WITHOUT_DRACO_MESHOPT = [false, false] as const;

type GltfResult = GLTF;

type LocomotionProps = {
  skinAnimation?: 'idle' | 'walk';
  skinAnimationRef?: MutableRefObject<'idle' | 'walk'>;
  skinClipHints?: SkinLocomotionHints;
  skinLocomotionHardSwitch?: boolean;
};

/** Mixer живёт отдельно от `<Clone>` — на three-test без locomotion не монтируется. */
function LocomotionMixerDriver({
  targetRef,
  gltf,
  skinAnimation,
  skinAnimationRef,
  skinClipHints,
  skinLocomotionHardSwitch = false,
}: LocomotionProps & {
  targetRef: MutableRefObject<ThreeGroup | null>;
  gltf: GltfResult;
}) {
  const mixerRef = useRef<AnimationMixer | null>(null);
  const mixerReadyRef = useRef(false);

  const driveAnimations =
    skinAnimation !== undefined || skinAnimationRef !== undefined;

  const idleNames = useMemo(
    () => [...(skinClipHints?.idle ?? []), ...DEFAULT_IDLE_NAMES],
    [skinClipHints]
  );
  const walkNames = useMemo(
    () => [...(skinClipHints?.walk ?? []), ...DEFAULT_WALK_NAMES],
    [skinClipHints]
  );

  const locomotionResolved = useMemo(() => {
    const resolved = resolveLocomotionClips(
      gltf.animations,
      idleNames,
      walkNames
    );
    return {
      idle: resolved.idle ? sanitizeLocomotionClip(resolved.idle) : null,
      walk: resolved.walk
        ? sanitizeLocomotionClip(resolved.walk, resolved.idle ?? null)
        : null,
    };
  }, [gltf, idleNames, walkNames]);

  const idleClip = locomotionResolved.idle;
  const walkClip = locomotionResolved.walk;

  const idleClipUuid = idleClip?.uuid ?? '';
  const walkClipUuid = walkClip?.uuid ?? '';
  const idleActionRef = useRef<AnimationAction | null>(null);
  const walkActionRef = useRef<AnimationAction | null>(null);
  const appliedAnimRef = useRef<'idle' | 'walk' | null>(null);

  const bindMixerActions = (mixer: AnimationMixer) => {
    mixer.stopAllAction();
    appliedAnimRef.current = null;
    idleActionRef.current = idleClip ? mixer.clipAction(idleClip) : null;
    walkActionRef.current =
      walkClip && walkClip !== idleClip
        ? mixer.clipAction(walkClip)
        : idleActionRef.current;
  };

  useEffect(() => {
    if (!mixerReadyRef.current || !mixerRef.current) return;
    bindMixerActions(mixerRef.current);
    return () => {
      mixerRef.current?.stopAllAction();
    };
  }, [idleClipUuid, walkClipUuid]);

  useEffect(() => {
    if (driveAnimations) return;
    appliedAnimRef.current = null;
    mixerRef.current?.stopAllAction();
  }, [driveAnimations]);

  const lastLocomotionLogKey = useRef('');
  useEffect(() => {
    if (!__DEV__ || !driveAnimations) return;
    const dbgKey = `${idleClipUuid}|${walkClipUuid}|${skinLocomotionHardSwitch}`;
    if (lastLocomotionLogKey.current === dbgKey) return;
    lastLocomotionLogKey.current = dbgKey;
    console.log('[Model locomotion]', {
      idleClip: idleClip?.name ?? null,
      walkClip: walkClip?.name ?? null,
      sameClip: idleClip != null && idleClip === walkClip,
      idleTracks: idleClip?.tracks.length ?? 0,
      walkTracks: walkClip?.tracks.length ?? 0,
      hardSwitch: skinLocomotionHardSwitch,
    });
  }, [
    driveAnimations,
    idleClipUuid,
    walkClipUuid,
    skinLocomotionHardSwitch,
    idleClip?.name,
    walkClip?.name,
    idleClip?.tracks.length,
    walkClip?.tracks.length,
    idleClip === walkClip,
  ]);

  useFrame((_, delta) => {
    const target = targetRef.current;
    if (!target) return;

    if (!mixerReadyRef.current) {
      mixerRef.current = new AnimationMixer(target);
      bindMixerActions(mixerRef.current);
      mixerReadyRef.current = true;
    }

    const mixer = mixerRef.current;
    if (!mixer) return;

    if (!driveAnimations) {
      mixer.update(delta);
      return;
    }

    const want =
      skinAnimationRef?.current ?? skinAnimation ?? 'idle';
    const idleA = idleActionRef.current;
    const walkA = walkActionRef.current;
    const enter = want === 'walk' ? walkA ?? idleA : idleA ?? walkA ?? null;

    if (!enter) {
      mixer.update(delta);
      return;
    }

    if (appliedAnimRef.current === want) {
      mixer.update(delta);
      return;
    }

    if (skinLocomotionHardSwitch) {
      mixer.stopAllAction();
      enter.reset().setLoop(LoopRepeat, Infinity).setEffectiveWeight(1).play();
      appliedAnimRef.current = want;
      mixer.update(delta);
      return;
    }

    const prevWant = appliedAnimRef.current;

    let leave: AnimationAction | null = null;
    if (prevWant === 'walk') leave = walkA ?? idleA ?? null;
    else if (prevWant === 'idle') leave = idleA ?? walkA ?? null;

    const sameAction = !!leave && !!enter && leave === enter;

    if (sameAction) {
      enter.setEffectiveWeight(1).play();
      appliedAnimRef.current = want;
      mixer.update(delta);
      return;
    }

    leave?.fadeOut(0.2);
    enter.reset().setLoop(LoopRepeat, Infinity).fadeIn(0.22).play();
    appliedAnimRef.current = want;
    mixer.update(delta);
  }, SKIN_MIXER_PRIORITY);

  useEffect(
    () => () => {
      mixerRef.current?.stopAllAction();
      mixerRef.current = null;
      mixerReadyRef.current = false;
    },
    []
  );

  return null;
}

/**
 * Рабочий RN-путь: `<Clone>` под group ref (ref на Clone ломал/не находил меши).
 * Locomotion — только если явно переданы props или есть клипы в GLB.
 */
function ModelDreiClone({
  gltf,
  skinAnimation,
  skinAnimationRef,
  skinClipHints,
  skinLocomotionHardSwitch = false,
  ...groupProps
}: { gltf: GltfResult } & LocomotionProps &
  Omit<ThreeElements['group'], 'ref'>) {
  const groupRef = useRef<ThreeGroup>(null);
  const frustumPreparedRef = useRef(false);

  useFrame(() => {
    const group = groupRef.current;
    if (!group || frustumPreparedRef.current) return;
    let foundSkinned = false;
    group.traverse((obj) => {
      if (obj instanceof SkinnedMesh) {
        obj.frustumCulled = false;
        foundSkinned = true;
      }
    });
    if (foundSkinned) frustumPreparedRef.current = true;
  });

  const needsMixer =
    gltf.animations.length > 0 &&
    (skinAnimation !== undefined || skinAnimationRef !== undefined);

  return (
    <group ref={groupRef} {...groupProps}>
      <Clone object={gltf.scene} />
      {needsMixer ? (
        <LocomotionMixerDriver
          targetRef={groupRef}
          gltf={gltf}
          skinAnimation={skinAnimation}
          skinAnimationRef={skinAnimationRef}
          skinClipHints={skinClipHints}
          skinLocomotionHardSwitch={skinLocomotionHardSwitch}
        />
      ) : null}
    </group>
  );
}

function ModelSkinnedPrimitive({
  gltf,
  skinAnimation,
  skinAnimationRef,
  skinClipHints,
  skinLocomotionHardSwitch = false,
  ...groupProps
}: {
  gltf: GltfResult;
  skinAnimation?: 'idle' | 'walk';
  skinAnimationRef?: MutableRefObject<'idle' | 'walk'>;
  skinClipHints?: SkinLocomotionHints;
  skinLocomotionHardSwitch?: boolean;
} & Omit<ThreeElements['group'], 'ref'>) {
  const sceneInstance = useMemo(() => {
    const root = cloneSkinnedScene(gltf.scene);
    disableSkinnedFrustumCull(root);
    return root;
  }, [gltf.scene]);
  const mixer = useMemo(
    () => new AnimationMixer(sceneInstance),
    [sceneInstance]
  );

  const driveAnimations =
    skinAnimation !== undefined || skinAnimationRef !== undefined;

  const idleNames = useMemo(
    () => [...(skinClipHints?.idle ?? []), ...DEFAULT_IDLE_NAMES],
    [skinClipHints]
  );
  const walkNames = useMemo(
    () => [...(skinClipHints?.walk ?? []), ...DEFAULT_WALK_NAMES],
    [skinClipHints]
  );

  const locomotionResolved = useMemo(() => {
    const resolved = resolveLocomotionClips(
      gltf.animations,
      idleNames,
      walkNames
    );
    return {
      idle: resolved.idle ? sanitizeLocomotionClip(resolved.idle) : null,
      walk: resolved.walk
        ? sanitizeLocomotionClip(resolved.walk, resolved.idle ?? null)
        : null,
    };
  }, [gltf, idleNames, walkNames]);

  const idleClip = locomotionResolved.idle;
  const walkClip = locomotionResolved.walk;

  const idleClipUuid = idleClip?.uuid ?? '';
  const walkClipUuid = walkClip?.uuid ?? '';
  const idleActionRef = useRef<AnimationAction | null>(null);
  const walkActionRef = useRef<AnimationAction | null>(null);
  const appliedAnimRef = useRef<'idle' | 'walk' | null>(null);

  const runMixer =
    driveAnimations || gltf.animations.length > 0;

  useEffect(() => {
    if (!runMixer) return;
    mixer.stopAllAction();
    appliedAnimRef.current = null;
    idleActionRef.current = idleClip ? mixer.clipAction(idleClip) : null;
    walkActionRef.current =
      walkClip && walkClip !== idleClip
        ? mixer.clipAction(walkClip)
        : idleActionRef.current;

    return () => {
      mixer.stopAllAction();
    };
  }, [mixer, idleClipUuid, walkClipUuid, runMixer]);

  useEffect(() => {
    if (driveAnimations || !runMixer) return;
    appliedAnimRef.current = null;
    mixer.stopAllAction();
  }, [driveAnimations, mixer, runMixer]);

  const lastLocomotionLogKey = useRef('');
  useEffect(() => {
    if (!__DEV__ || !driveAnimations) return;
    const dbgKey = `${idleClipUuid}|${walkClipUuid}|${skinLocomotionHardSwitch}`;
    if (lastLocomotionLogKey.current === dbgKey) return;
    lastLocomotionLogKey.current = dbgKey;
    console.log('[Model locomotion]', {
      idleClip: idleClip?.name ?? null,
      walkClip: walkClip?.name ?? null,
      sameClip: idleClip != null && idleClip === walkClip,
      idleTracks: idleClip?.tracks.length ?? 0,
      walkTracks: walkClip?.tracks.length ?? 0,
      hardSwitch: skinLocomotionHardSwitch,
    });
  }, [
    driveAnimations,
    idleClipUuid,
    walkClipUuid,
    skinLocomotionHardSwitch,
    idleClip?.name,
    walkClip?.name,
    idleClip?.tracks.length,
    walkClip?.tracks.length,
    idleClip === walkClip,
  ]);

  useFrame((_, delta) => {
    if (!runMixer) return;

    if (!driveAnimations) {
      mixer.update(delta);
      return;
    }

    const want =
      skinAnimationRef?.current ?? skinAnimation ?? 'idle';
    const idleA = idleActionRef.current;
    const walkA = walkActionRef.current;
    const enter = want === 'walk' ? walkA ?? idleA : idleA ?? walkA ?? null;

    if (!enter) {
      mixer.update(delta);
      return;
    }

    if (appliedAnimRef.current === want) {
      mixer.update(delta);
      return;
    }

    if (skinLocomotionHardSwitch) {
      mixer.stopAllAction();
      enter.reset().setLoop(LoopRepeat, Infinity).setEffectiveWeight(1).play();
      appliedAnimRef.current = want;
      mixer.update(delta);
      return;
    }

    const prevWant = appliedAnimRef.current;

    let leave: AnimationAction | null = null;
    if (prevWant === 'walk') leave = walkA ?? idleA ?? null;
    else if (prevWant === 'idle') leave = idleA ?? walkA ?? null;

    const sameAction = !!leave && !!enter && leave === enter;

    if (sameAction) {
      enter.setEffectiveWeight(1).play();
      appliedAnimRef.current = want;
      mixer.update(delta);
      return;
    }

    leave?.fadeOut(0.2);
    enter.reset().setLoop(LoopRepeat, Infinity).fadeIn(0.22).play();
    appliedAnimRef.current = want;
    mixer.update(delta);
  }, SKIN_MIXER_PRIORITY);

  return (
    <group {...groupProps}>
      <primitive object={sceneInstance} />
    </group>
  );
}

function ModelFromUri({
  uri,
  skinAnimation,
  skinAnimationRef,
  skinClipHints,
  skinLocomotionHardSwitch = false,
  debugPlayerGltf = false,
  useDreiClone = true,
  ...groupProps
}: UriProps) {
  const gltf = useGLTF(uri, ...GLTF_WITHOUT_DRACO_MESHOPT);

  useEffect(() => {
    if (!debugPlayerGltf || !__DEV__) return;
    const childrenLen = gltf.scene.children.length;
    const animNames = gltf.animations.map((a) => a.name);
    const bbox = new Box3().setFromObject(gltf.scene);
    const sz = new Vector3();
    bbox.getSize(sz);
    console.log('[AR debug player GLB] gltf.scene.children.length', childrenLen);
    console.log('[AR debug player GLB] gltf.animations', animNames);
    console.log('[AR debug player GLB] bbox size', {
      x: sz.x,
      y: sz.y,
      z: sz.z,
    });
    logGltfMeshStats(gltf.scene, 'AR debug player GLB');
    const zeroSize =
      !Number.isFinite(sz.x + sz.y + sz.z) || sz.lengthSq() < 1e-12;
    if (bbox.isEmpty() || zeroSize) {
      console.warn(
        '[AR debug player GLB] bounding box empty or zero size',
        bbox.isEmpty(),
        sz
      );
    }
  }, [debugPlayerGltf, gltf.scene, gltf.animations]);

  if (useDreiClone) {
    return (
      <ModelDreiClone
        gltf={gltf}
        skinAnimation={skinAnimation}
        skinAnimationRef={skinAnimationRef}
        skinClipHints={skinClipHints}
        skinLocomotionHardSwitch={skinLocomotionHardSwitch}
        {...groupProps}
      />
    );
  }

  return (
    <ModelSkinnedPrimitive
      gltf={gltf}
      skinAnimation={skinAnimation}
      skinAnimationRef={skinAnimationRef}
      skinClipHints={skinClipHints}
      skinLocomotionHardSwitch={skinLocomotionHardSwitch}
      {...groupProps}
    />
  );
}

function ModelFromBundledModule({
  moduleId,
  ...rest
}: Omit<Props, 'source'> & { moduleId: number }) {
  // Если preload уже отработал — uri готов синхронно, модель рендерится в первом же кадре
  // после перемонтажа (онбординг → главный экран), без чёрной паузы Suspense.
  const [uri, setUri] = useState<string | null>(() => getCachedBundledUri(moduleId));

  useEffect(() => {
    if (uri) return;
    let cancelled = false;
    bundledModelModuleToUri(moduleId)
      .then((u) => {
        if (!cancelled) setUri(u);
      })
      .catch((e) => {
        if (__DEV__) console.warn('[Model] failed to resolve bundled GLB uri', e);
      });
    return () => {
      cancelled = true;
    };
  }, [moduleId, uri]);

  if (!uri) return null;
  return <ModelFromUri uri={uri} {...rest} />;
}

export default function Model({ source, ...rest }: Props) {
  if (typeof source === 'string') {
    return <ModelFromUri uri={source} {...rest} />;
  }
  return <ModelFromBundledModule moduleId={source} {...rest} />;
}

Model.preload = (source: ModelSource) => {
  if (typeof source === 'string') {
    useGLTF.preload(source, ...GLTF_WITHOUT_DRACO_MESHOPT);
    return;
  }
  bundledModelModuleToUri(source)
    .then((uri) => {
      useGLTF.preload(uri, ...GLTF_WITHOUT_DRACO_MESHOPT);
    })
    .catch((e) => {
      if (__DEV__) console.warn('[Model.preload]', e);
    });
};
