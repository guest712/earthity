import { useFrame } from '@react-three/fiber/native';
import { useRef } from 'react';
import type { Mesh } from 'three';

type Props = {
  color?: string;
  size?: number;
  /** Rotation speed in radians per second applied to X and Y axes. */
  rotationSpeed?: number;
};

/**
 * Simple rotating cube used as:
 * - the initial placeholder while the real GLTF model is still being made;
 * - the Suspense fallback while the GLTF is loading.
 *
 * Declarative r3f equivalent of what we previously rendered imperatively.
 */
export default function CubePlaceholder({
  color = '#5aa86a',
  size = 1,
  rotationSpeed = 0.9,
}: Props) {
  const meshRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.rotation.x += rotationSpeed * delta;
    mesh.rotation.y += rotationSpeed * delta;
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[size, size, size]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}
