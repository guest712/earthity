import { useFrame } from '@react-three/fiber/native';
import { useEffect, useMemo, useRef } from 'react';
import type MapView from 'react-native-maps';
import {
  ConeGeometry,
  CylinderGeometry,
  Euler,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
  Quaternion,
  Vector3,
} from 'three';

import { PROFILE_MAP_DECOR_TREES } from '../../lib/map/mapDecorConfig';

function resolveDecorPose(mapMode: '2D' | '3D_Tilt' | undefined): 'flat' | 'upright' {
  return mapMode === '3D_Tilt' ? 'upright' : 'flat';
}

function hash01(i: number, s: number): number {
  const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

type Props = {
  coordinates: { latitude: number; longitude: number }[];
  mapRef: React.RefObject<MapView | null>;
  mapMode?: '2D' | '3D_Tilt';
  /** Смена региона или `onMapReady` — повторная проекция точек. */
  projectEpoch: number;
  size: { w: number; h: number };
};

export default function MapDecorTrees({
  coordinates,
  mapRef,
  mapMode,
  projectEpoch,
  size,
}: Props) {
  const trunkRef = useRef<InstancedMesh>(null);
  const foliageRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const foliageGeom = useMemo(() => new ConeGeometry(9, 14, 5), []);
  const trunkGeom = useMemo(() => new CylinderGeometry(2.2, 2.8, 12, 6), []);
  const trunkMat = useMemo(
    () =>
      new MeshBasicMaterial({
        color: '#5c4030',
        transparent: true,
        opacity: 0.92,
        depthWrite: false,
      }),
    []
  );
  const foliageMat = useMemo(
    () =>
      new MeshBasicMaterial({
        color: '#2d6a40',
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
      }),
    []
  );

  const up = useMemo(() => new Vector3(0, 1, 0), []);
  const anchor = useMemo(() => new Vector3(), []);
  const trunkCenter = useMemo(() => new Vector3(), []);
  const foliageCenter = useMemo(() => new Vector3(), []);
  const quat = useMemo(() => new Quaternion(), []);
  const yawQuat = useMemo(() => new Quaternion(), []);
  const along = useMemo(() => new Vector3(), []);

  const resolvedPose = resolveDecorPose(mapMode);
  const poseQuat = useMemo(() => {
    const e = new Euler(resolvedPose === 'flat' ? Math.PI / 2 : 0, 0, 0);
    return new Quaternion().setFromEuler(e);
  }, [resolvedPose]);

  const projRef = useRef<{ x: number; y: number }[] | null>(null);

  useEffect(() => {
    const w = size.w;
    const h = size.h;
    if (coordinates.length === 0 || w < 2 || h < 2) {
      projRef.current = null;
      return;
    }
    const mv = mapRef.current;
    if (!mv || typeof (mv as any).pointForCoordinate !== 'function') {
      projRef.current = null;
      return;
    }

    let cancelled = false;
    void Promise.all(
      coordinates.map((coord) =>
        (mv as any).pointForCoordinate({
          latitude: coord.latitude,
          longitude: coord.longitude,
        })
      )
    )
      .then((points: { x: number; y: number }[]) => {
        if (cancelled) return;
        projRef.current = points.map((p) => ({
          x: p.x - w / 2,
          y: -(p.y - h / 2),
        }));
      })
      .catch(() => {
        if (!cancelled) projRef.current = null;
      });
    return () => {
      cancelled = true;
    };
  }, [coordinates, mapRef, projectEpoch, size.h, size.w]);

  const profileRef = useRef({ frames: 0, acc: 0, lastLog: 0 });

  useFrame((_, delta) => {
    const tr = trunkRef.current;
    const fo = foliageRef.current;
    const pts = projRef.current;
    if (!tr || !fo || !pts || pts.length !== coordinates.length) return;

    const baseZ = resolvedPose === 'flat' ? -4 : -2;

    for (let i = 0; i < coordinates.length; i++) {
      const p = pts[i];
      if (!p) continue;
      const seed = ((coordinates.length * 73856093) ^ (i * 19349663)) >>> 0;
      const s = 0.75 + hash01(i, seed) * 0.55;
      const yaw = hash01(i, seed + 1) * Math.PI * 2;

      yawQuat.setFromAxisAngle(up, yaw);
      quat.copy(poseQuat).multiply(yawQuat);

      anchor.set(p.x, p.y, baseZ);

      along.copy(up).applyQuaternion(quat).multiplyScalar(6 * s);
      trunkCenter.copy(anchor).add(along);
      dummy.position.copy(trunkCenter);
      dummy.quaternion.copy(quat);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      tr.setMatrixAt(i, dummy.matrix);

      along.copy(up).applyQuaternion(quat).multiplyScalar(12 * s + 7 * s);
      foliageCenter.copy(anchor).add(along);
      dummy.position.copy(foliageCenter);
      dummy.quaternion.copy(quat);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      fo.setMatrixAt(i, dummy.matrix);
    }

    tr.instanceMatrix.needsUpdate = true;
    fo.instanceMatrix.needsUpdate = true;

    if (PROFILE_MAP_DECOR_TREES) {
      const pr = profileRef.current;
      pr.frames += 1;
      pr.acc += delta;
      const now =
        typeof globalThis.performance !== 'undefined'
          ? globalThis.performance.now()
          : Date.now();
      if (now - pr.lastLog > 2000 && pr.acc > 0) {
        const fps = pr.frames / pr.acc;
        console.log('[MapDecorTrees] ~fps', fps.toFixed(1), 'n=', coordinates.length);
        pr.frames = 0;
        pr.acc = 0;
        pr.lastLog = now;
      }
    }
  });

  const n = coordinates.length;
  if (n === 0) return null;

  return (
    <group>
      <instancedMesh ref={trunkRef} args={[trunkGeom, trunkMat, n]} frustumCulled={false} />
      <instancedMesh ref={foliageRef} args={[foliageGeom, foliageMat, n]} frustumCulled={false} />
    </group>
  );
}
