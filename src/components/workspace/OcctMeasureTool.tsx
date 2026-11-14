'use client';

import * as React from 'react';
import { useThree } from '@react-three/fiber';
import { Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import oc from 'libcascade';
import type { gp_Pnt, TopoDS_Vertex, TopoDS_Shape } from 'libcascade';
import { useOcctShape } from '@/components/3d/occt-context';

export type MeasureMode = 'distance' | 'angle' | 'diameter' | 'radius';

interface OcctMeasureToolProps {
  enabled: boolean;
  mode: MeasureMode;
}

function threeToGpPnt(point: THREE.Vector3): gp_Pnt {
  return new oc.gp_Pnt(point.x, point.y, point.z);
}

function makeVertex(point: THREE.Vector3): TopoDS_Vertex {
  const gpPnt = threeToGpPnt(point);
  return new oc.BRepBuilderAPI_MakeVertex(gpPnt).Vertex();
}

function projectPointOnShape(point: THREE.Vector3, shape: TopoDS_Shape): THREE.Vector3 {
  const vertex = makeVertex(point);
  const dist = new oc.BRepExtrema_DistShapeShape(vertex, shape);
  if (dist.Perform() && dist.NbSolution() > 0) {
    const solution = dist.PointOnShape2(1);
    return new THREE.Vector3(solution.X(), solution.Y(), solution.Z());
  }
  return point;
}

function measureDistance(p1: THREE.Vector3, p2: THREE.Vector3): number {
  const v1 = makeVertex(p1);
  const v2 = makeVertex(p2);
  const dist = new oc.BRepExtrema_DistShapeShape(v1, v2);
  if (dist.Perform()) {
    return dist.Value();
  }
  return p1.distanceTo(p2);
}

export function OcctMeasureTool({ enabled, mode }: OcctMeasureToolProps) {
  const { shape } = useOcctShape();
  const { camera, gl, scene } = useThree();
  const [points, setPoints] = React.useState<THREE.Vector3[]>([]);
  const [result, setResult] = React.useState<string | null>(null);
  const [highlightedEntities, setHighlightedEntities] = React.useState<
    { type: 'vertex' | 'edge' | 'face'; point: THREE.Vector3 }[]
  >([]);

  const raycasterRef = React.useRef(new THREE.Raycaster());
  const prevModeRef = React.useRef(mode);

  const maxPoints = mode === 'angle' ? 3 : 2;

  React.useEffect(() => {
    if (!enabled || !shape) return;

    const handleClick = (event: MouseEvent) => {
      if (prevModeRef.current !== mode) {
        prevModeRef.current = mode;
        setPoints([]);
        setResult(null);
        setHighlightedEntities([]);
      }

      const rect = gl.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycasterRef.current.setFromCamera(mouse, camera);
      const intersects = raycasterRef.current.intersectObjects(scene.children, true);
      const firstIntersect = intersects[0];
      if (firstIntersect) {
        let point = firstIntersect.point.clone();
        point = projectPointOnShape(point, shape);
        setPoints((prev) => {
          if (prev.length >= maxPoints) {
            return [point];
          }
          return [...prev, point];
        });
      }
    };

    gl.domElement.addEventListener('click', handleClick);
    return () => {
      gl.domElement.removeEventListener('click', handleClick);
      setPoints([]);
      setResult(null);
      setHighlightedEntities([]);
    };
  }, [enabled, shape, camera, gl, scene, mode, maxPoints]);

  React.useEffect(() => {
    if (!shape || points.length === 0) {
      setResult(null);
      return;
    }

    try {
      if (mode === 'distance' && points.length >= 2) {
        const p1 = points[0];
        const p2 = points[1];
        if (p1 && p2) {
          const distance = measureDistance(p1, p2);
          setResult(`${distance.toFixed(2)} mm`);
        }
      } else if (mode === 'angle' && points.length >= 3) {
        const p1 = points[0];
        const p2 = points[1];
        const p3 = points[2];
        if (p1 && p2 && p3) {
          const v1 = new THREE.Vector3().subVectors(p1, p2).normalize();
          const v2 = new THREE.Vector3().subVectors(p3, p2).normalize();
          const angle = v1.angleTo(v2) * (180 / Math.PI);
          setResult(`${angle.toFixed(2)} deg`);
        }
      } else if (mode === 'diameter' && points.length >= 2) {
        const p1 = points[0];
        const p2 = points[1];
        if (p1 && p2) {
          const distance = measureDistance(p1, p2);
          const radius = distance / 2;
          setResult(`Diameter: ${distance.toFixed(2)} mm (Radius ${radius.toFixed(2)} mm)`);
        }
      } else if (mode === 'radius' && points.length >= 1) {
        const p1 = points[0];
        if (p1) {
          setResult(`Point: ${p1.x.toFixed(2)}, ${p1.y.toFixed(2)}, ${p1.z.toFixed(2)}`);
        }
      }
    } catch (err) {
      console.error('[OCCT:measure] Erreur', err);
      setResult('Erreur de mesure');
    }
  }, [points, shape, mode]);

  if (!enabled) return null;

  const displayPoints =
    highlightedEntities.length > 0 ? highlightedEntities.map((e) => e.point) : points;

  const p0 = points[0];
  const p1 = points[1];
  const p2 = points[2];
  const lastPoint = points[points.length - 1];

  return (
    <>
      {displayPoints.map((pt, i) => (
        <mesh key={i} position={pt}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshBasicMaterial color={i === 0 ? 'red' : i === 1 ? 'blue' : 'orange'} />
        </mesh>
      ))}
      {mode === 'distance' && points.length === 2 && p0 && p1 && (
        <Line points={[p0, p1]} color="red" lineWidth={2} />
      )}
      {mode === 'angle' && points.length === 3 && p0 && p1 && p2 && (
        <>
          <Line points={[p0, p1]} color="red" lineWidth={2} />
          <Line points={[p1, p2]} color="red" lineWidth={2} />
        </>
      )}
      {mode === 'diameter' && points.length === 2 && p0 && p1 && (
        <Line points={[p0, p1]} color="red" lineWidth={2} />
      )}
      {result && points.length > 0 && lastPoint && (
        <Html position={lastPoint}>
          <div className="rounded bg-black/80 px-2 py-1 text-xs text-white shadow-lg">{result}</div>
        </Html>
      )}
    </>
  );
}
