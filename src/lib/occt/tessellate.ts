import * as THREE from 'three';
import oc from 'libcascade';
import type { TopoDS_Shape } from 'libcascade';

/**
 * Convertit une TopoDS_Shape OCCT en BufferGeometry Three.js.
 * Réutilise la logique de occt-poc.tsx (TÂCHE 3 de V8-C-1b).
 */
export function tessellateShape(shape: TopoDS_Shape, deflection = 0.1): THREE.BufferGeometry {
  const vertices: number[] = [];
  const indices: number[] = [];
  let faceCount = 0;

  // Tesseller la shape
  const mesh = new oc.BRepMesh_IncrementalMesh(shape, deflection, false, 0.5, false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (mesh.Perform as any)();

  // Parcourir les faces
  const explorer = new oc.TopExp_Explorer(shape, oc.TopAbs_ShapeEnum.TopAbs_FACE);

  while (explorer.More()) {
    faceCount++;
    const face = oc.TopoDS.Face(explorer.Current());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const location = new (oc.TopLoc_Location as any)();
    const triangulation = oc.BRep_Tool.Triangulation(face, location, 0);

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

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();

  console.log('[OCCT:tessellate] Shape tessellée', {
    vertices: vertices.length / 3,
    indices: indices.length,
    faces: faceCount,
  });

  if (vertices.length === 0) {
    console.error('[OCCT:tessellate] NO VERTICES EXTRACTED — tessellation failed');
  }

  return geom;
}
