'use client';

import { useThree } from '@react-three/fiber';
import { Line, Html } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export type MeasureMode = 'distance' | 'angle' | 'diameter';

interface MeasureToolProps {
  enabled: boolean;
  mode?: MeasureMode;
}

function createCirclePoints(center: THREE.Vector3, radius: number, segments = 32): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    points.push(
      new THREE.Vector3(center.x + Math.cos(t) * radius, center.y + Math.sin(t) * radius, center.z),
    );
  }
  return points;
}

export function MeasureTool({ enabled, mode = 'distance' }: MeasureToolProps) {
  const { camera, gl, scene } = useThree();
  const [points, setPoints] = useState<THREE.Vector3[]>([]);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const prevModeRef = useRef(mode);

  const maxPoints = mode === 'angle' ? 3 : 2;

  useEffect(() => {
    if (!enabled) return;
    const onClick = (e: MouseEvent) => {
      if (prevModeRef.current !== mode) {
        prevModeRef.current = mode;
        setPoints([]);
      }
      const rect = gl.domElement.getBoundingClientRect();
      mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.current.setFromCamera(mouse.current, camera);
      const intersects = raycaster.current.intersectObjects(scene.children, true);
      if (intersects.length > 0) {
        const p = intersects[0]!.point.clone();
        setPoints((prev) => {
          if (prev.length >= maxPoints) {
            return [p];
          }
          return [...prev, p];
        });
      }
    };
    gl.domElement.addEventListener('click', onClick);
    return () => {
      gl.domElement.removeEventListener('click', onClick);
      setPoints([]);
    };
  }, [enabled, camera, gl, scene, mode, maxPoints]);

  if (!enabled || points.length === 0) return null;

  const first = points[0] as THREE.Vector3;

  if (mode === 'angle') {
    if (points.length < 3) {
      return (
        <>
          {points.map((p, i) => (
            <mesh key={i} position={p}>
              <sphereGeometry args={[0.05]} />
              <meshBasicMaterial color={i < 2 ? 'red' : 'orange'} />
            </mesh>
          ))}
        </>
      );
    }
    const p1 = points[0]!;
    const p2 = points[1]!;
    const p3 = points[2]!;
    const v1 = new THREE.Vector3().subVectors(p1, p2);
    const v2 = new THREE.Vector3().subVectors(p3, p2);
    const angleRad = v1.angleTo(v2);
    const angleDeg = ((angleRad * 180) / Math.PI).toFixed(1);

    return (
      <>
        <mesh position={p1}>
          <sphereGeometry args={[0.05]} />
          <meshBasicMaterial color="red" />
        </mesh>
        <mesh position={p2}>
          <sphereGeometry args={[0.05]} />
          <meshBasicMaterial color="blue" />
        </mesh>
        <mesh position={p3}>
          <sphereGeometry args={[0.05]} />
          <meshBasicMaterial color="red" />
        </mesh>
        <Line points={[p1, p2]} color="red" lineWidth={2} />
        <Line points={[p2, p3]} color="red" lineWidth={2} />
        <Html position={p2}>
          <div className="rounded bg-white px-1 text-xs text-blue-600 shadow">{angleDeg}°</div>
        </Html>
      </>
    );
  }

  if (mode === 'diameter') {
    if (points.length < 2) {
      return (
        <mesh position={first}>
          <sphereGeometry args={[0.05]} />
          <meshBasicMaterial color="red" />
        </mesh>
      );
    }
    const p2 = points[1]!;
    const distance = first.distanceTo(p2);
    const center = first.clone().add(p2).divideScalar(2);
    const circlePoints = createCirclePoints(center, distance / 2);

    return (
      <>
        <mesh position={first}>
          <sphereGeometry args={[0.05]} />
          <meshBasicMaterial color="red" />
        </mesh>
        <mesh position={p2}>
          <sphereGeometry args={[0.05]} />
          <meshBasicMaterial color="red" />
        </mesh>
        <Line points={[first, p2]} color="red" lineWidth={2} />
        <Line points={circlePoints} color="orange" lineWidth={1} />
        <Html position={center}>
          <div className="rounded bg-white px-1 text-xs text-orange-600 shadow">
            Ø {distance.toFixed(2)}
          </div>
        </Html>
      </>
    );
  }

  const second = points[1];
  if (!second) {
    return (
      <mesh position={first}>
        <sphereGeometry args={[0.05]} />
        <meshBasicMaterial color="red" />
      </mesh>
    );
  }

  return (
    <>
      <mesh position={first}>
        <sphereGeometry args={[0.05]} />
        <meshBasicMaterial color="red" />
      </mesh>
      <Line points={[first, second]} color="red" lineWidth={2} />
      <Html position={second}>
        <div className="rounded bg-white px-1 text-xs text-red-600 shadow">
          {first.distanceTo(second).toFixed(2)}
        </div>
      </Html>
    </>
  );
}
