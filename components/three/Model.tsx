import { useGLTF } from '@react-three/drei/native';
import { useFrame } from '@react-three/fiber/native';
import type { ThreeElements } from '@react-three/fiber/native';
import type { MutableRefObject } from 'react';
import { useEffect, useMemo, useRef } from 'react';
import {
  AnimationClip,
  AnimationMixer,
  Box3,
  LoopRepeat,
  Vector3,
  type AnimationAction,
  type KeyframeTrack,
} from 'three';
import { clone as cloneSkinnedScene } from 'three/examples/jsm/utils/SkeletonUtils.js';

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
  /** Temporary AR debug: log GLTF scene / anims / bbox (MapARScene player only). */
  debugPlayerGltf?: boolean;
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

export default function Model({
  source,
  skinAnimation,
  skinAnimationRef,
  skinClipHints,
  skinLocomotionHardSwitch = false,
  debugPlayerGltf = false,
  ...groupProps
}: Props) {
  const gltf = useGLTF(source as string);

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

  const sceneInstance = useMemo(
    () => cloneSkinnedScene(gltf.scene),
    [gltf.scene]
  );
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

  useEffect(() => {
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
  }, [mixer, idleClipUuid, walkClipUuid]);

  useEffect(() => {
    if (driveAnimations) return;
    appliedAnimRef.current = null;
    mixer.stopAllAction();
  }, [driveAnimations, mixer]);

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

Model.preload = (source: ModelSource) => {
  useGLTF.preload(source as string);
};
