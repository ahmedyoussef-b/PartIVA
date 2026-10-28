'use client';

import { useThree } from '@react-three/fiber';
import { Line, Html } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface MeasureToolProps {
  enabled: boolean;
}

export function MeasureTool({ enabled }: MeasureToolProps) {
  const { camera, gl, scene } = useThree();
  const [points, setPoints] = useState<THREE.Vector3[]>([]);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  useEffect(() => {
    if (!enabled) return;
    const onClick = (e: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.current.setFromCamera(mouse.current, camera);
      const intersects = raycaster.current.intersectObjects(scene.children, true);
      if (intersects.length > 0) {
        const p = intersects[0]!.point.clone();
        setPoints((prev) => (prev.length >= 2 ? [p] : [...prev, p]));
      }
    };
    gl.domElement.addEventListener('click', onClick);
    return () => {
      gl.domElement.removeEventListener('click', onClick);
      setPoints([]);
    };
  }, [enabled, camera, gl, scene]);

  if (!enabled || points.length === 0) return null;

  const first = points[0] as THREE.Vector3;
  if (!first) return null;
  const second = points[1];

  return (
    <>
      <mesh position={first}>
        <sphereGeometry args={[0.05]} />
        <meshBasicMaterial color="red" />
      </mesh>
      {second && (
        <>
          <Line points={[first, second]} color="red" lineWidth={2} />
          <Html position={second}>
            <div className="rounded bg-white px-1 text-xs text-red-600 shadow">
              {first.distanceTo(second).toFixed(2)}
            </div>
          </Html>
        </>
      )}
    </>
  );
}
