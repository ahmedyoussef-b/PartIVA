'use client';

import * as React from 'react';
import type { TopoDS_Shape, TopLoc_Location, gp_Pnt, Poly_Triangle } from 'libcascade';
import { Canvas } from '@react-three/fiber';
import { Grid, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface OcctBox {
  Shape(): TopoDS_Shape;
  delete(): void;
}

interface OcctMesh {
  Perform(): void;
  delete(): void;
}

interface PolyTriangulation {
  NbNodes(): number;
  NbTriangles(): number;
  Node(index: number): gp_Pnt;
  Triangle(index: number): Poly_Triangle;
  delete(): void;
}

interface OcctCalls {
  BRepPrimAPI_MakeBox: new (dx: number, dy: number, dz: number) => OcctBox;
  BRepMesh_IncrementalMesh: new (
    shape: TopoDS_Shape,
    linDefl: number,
    isRelative: boolean,
    angDefl: number,
    isParallel: boolean,
  ) => OcctMesh;
  TopExp_Explorer: new (
    shape: TopoDS_Shape,
    type: number,
    avoid?: number,
  ) => {
    More(): boolean;
    Next(): void;
    Current(): TopoDS_Shape;
    delete(): void;
  };
  TopoDS: {
    Face(shape: TopoDS_Shape): TopoDS_Shape;
  };
  TopLoc_Location: new () => TopLoc_Location;
  BRep_Tool: {
    Triangulation(
      face: TopoDS_Shape,
      location: TopLoc_Location,
      purpose: number,
    ): PolyTriangulation;
  };
  TopAbs_ShapeEnum: {
    TopAbs_FACE: number;
  };
}

export function OcctPoc() {
  const [geometry, setGeometry] = React.useState<THREE.BufferGeometry | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        console.log('[OCCT:POC] Starting import...');
        const oc = await import('libcascade');
        console.log('[OCCT:POC] Import done, creating box...');
        const calls: OcctCalls = oc as unknown as OcctCalls;

        // 1. Créer le cube OCCT
        const box = new calls.BRepPrimAPI_MakeBox(10, 10, 10);
        const shape = box.Shape();
        console.log('[OCCT:POC] Starting extraction', { shapeType: shape.ShapeType() });

        // 2. Tesseller le cube
        const mesh = new calls.BRepMesh_IncrementalMesh(shape, 0.1, false, 0.5, false);
        mesh.Perform();

        // 3. Extraire la géométrie face par face
        const vertices: number[] = [];
        const indices: number[] = [];

        const explorer = new calls.TopExp_Explorer(shape, calls.TopAbs_ShapeEnum.TopAbs_FACE);
        let faceCount = 0;
        while (explorer.More()) {
          faceCount++;
          const face = calls.TopoDS.Face(explorer.Current());
          const location = new calls.TopLoc_Location();
          const triangulation = calls.BRep_Tool.Triangulation(face, location, 0);

          if (triangulation) {
            const nbNodes = triangulation.NbNodes();
            const nbTriangles = triangulation.NbTriangles();
            const offset = vertices.length / 3;

            for (let i = 1; i <= nbNodes; i++) {
              const node = triangulation.Node(i);
              vertices.push(node.X(), node.Y(), node.Z());
              node.delete();
            }

            for (let i = 1; i <= nbTriangles; i++) {
              const tri = triangulation.Triangle(i);
              indices.push(
                tri.Value(1) - 1 + offset,
                tri.Value(2) - 1 + offset,
                tri.Value(3) - 1 + offset,
              );
              tri.delete();
            }

            triangulation.delete();
          }
          explorer.Next();
        }
        console.log('[OCCT:POC] Extraction done', {
          vertices: vertices.length / 3,
          indices: indices.length / 3,
          faces: faceCount,
        });
        if (vertices.length === 0) {
          console.error('[OCCT:POC] NO VERTICES EXTRACTED — extraction failed');
        }

        // 4. Construire la géométrie Three.js
        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geom.setIndex(indices);
        geom.computeVertexNormals();

        box.delete();
        mesh.delete();
        explorer.delete();

        if (mounted) {
          setGeometry(geom);
          setLoading(false);
        }
      } catch (err) {
        console.error('[OCCT:POC] Erreur extraction', err);
        if (mounted) setError((err as Error).message);
        setLoading(false);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <div>Chargement OpenCascade.js...</div>;
  if (error) return <div>Erreur : {error}</div>;

  return (
    <div style={{ height: '600px', width: '100%' }}>
      <Canvas camera={{ position: [15, 15, 15], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Grid infiniteGrid />
        {geometry && (
          <mesh geometry={geometry}>
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
        )}
        <OrbitControls />
      </Canvas>
    </div>
  );
}
