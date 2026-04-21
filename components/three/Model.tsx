import { useGLTF } from '@react-three/drei/native';
import type { GroupProps } from '@react-three/fiber/native';

/**
 * GLTF source: either a `require('../../assets/models/foo.glb')` call
 * (returns a Metro module id number) or a remote URL string.
 *
 * `.glb` / `.gltf` must be registered as Metro asset extensions — see
 * `metro.config.js` in the project root.
 */
export type ModelSource = number | string;

type Props = GroupProps & {
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
 * Suspense:
 * - `useGLTF` throws a Promise while loading — parent component MUST be
 *   inside a <Suspense fallback={...}> boundary. See `Scene3D.tsx`.
 *
 * Preloading:
 * - Call `Model.preload(require('...'))` early (e.g. on app start or when
 *   the model is about to be needed) to remove the loading hitch.
 *
 * Example:
 *   <Model
 *     source={require('../../assets/models/first-cube.glb')}
 *     scale={0.5}
 *     position={[0, 0, 0]}
 *   />
 */
export default function Model({ source, ...groupProps }: Props) {
  const gltf = useGLTF(source as string);
  return <primitive object={gltf.scene} {...groupProps} />;
}

Model.preload = (source: ModelSource) => {
  useGLTF.preload(source as string);
};
