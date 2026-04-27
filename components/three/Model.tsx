import { useGLTF } from '@react-three/drei/native';
import type { ThreeElements } from '@react-three/fiber/native';
import { useMemo } from 'react';

/**
 * GLTF source: either a `require('../../assets/models/foo.glb')` call
 * (returns a Metro module id number) or a remote URL string.
 *
 * `.glb` / `.gltf` must be registered as Metro asset extensions — see
 * `metro.config.js` in the project root.
 */
export type ModelSource = number | string;

type Props = ThreeElements['group'] & {
  source: ModelSource;
};

/**
 * Thin wrapper around `useGLTF` from `@react-three/drei/native`.
 *
 * Why a wrapper?
 * - Centralizes the type of `source` (Metro module id vs URL).
 * - Gives us a single place to add shared tweaks later: shadow flags,
 *   material overrides, animation clip selection, LOD, etc.
 *
 * IMPORTANT — per-instance clone:
 * `useGLTF` is globally memoized by source, so every consumer receives
 * the SAME `gltf.scene` reference. In Three.js a single Object3D can
 * only have one parent at a time — adding it under a second `<primitive>`
 * silently re-parents it, leaving every other instance empty. With a
 * shared GLB (e.g. one wolf used for the player and several creatures)
 * this looks like models "stealing" each other or randomly disappearing.
 * We deep-clone the scene per-instance via `gltf.scene.clone(true)`.
 *
 * Notes:
 * - `clone(true)` does NOT clone geometries/materials — they remain
 *   shared, which is exactly what we want (shared GPU resources).
 * - For SkinnedMesh / animations later, switch to
 *   `SkeletonUtils.clone(...)` from `three-stdlib` so bone bindings
 *   point at each instance's own skeleton.
 *
 * Suspense:
 * - `useGLTF` throws a Promise while loading — parent component MUST be
 *   inside a <Suspense fallback={...}> boundary. See `Scene3D.tsx`.
 *
 * Preloading:
 * - Call `Model.preload(require('...'))` early (e.g. on app start or when
 *   the model is about to be needed) to remove the loading hitch.
 */
export default function Model({ source, ...groupProps }: Props) {
  const gltf = useGLTF(source as string);
  const sceneInstance = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  return <primitive object={sceneInstance} {...groupProps} />;
}

Model.preload = (source: ModelSource) => {
  useGLTF.preload(source as string);
};
