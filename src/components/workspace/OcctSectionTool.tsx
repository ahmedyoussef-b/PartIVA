'use client';

import * as React from 'react';
import * as THREE from 'three';
import oc from 'libcascade';
import type { Poly_PolygonOnTriangulation, Poly_Triangulation } from 'libcascade';
import { useOcctShape } from '@/components/3d/occt-context';

interface OcctSectionToolProps {
  enabled: boolean;
  position: number; // 0-1
}

export function OcctSectionTool({ enabled, position }: OcctSectionToolProps) {
  const { shape } = useOcctShape();
  const [sectionGeometry, setSectionGeometry] = React.useState<THREE.BufferGeometry | null>(null);

  React.useEffect(() => {
    if (!enabled || !shape) {
      return;
    }

    try {
      // 1. Compute bounding box to position the plane
      const bbox = new oc.Bnd_Box();
      oc.BRepBndLib.Add(shape, bbox, true);

      if (bbox.IsVoid()) {
        return;
      }

      const xmin = bbox.CornerMin().X();
      const xmax = bbox.CornerMax().X();
      const x = xmin + (xmax - xmin) * position;

      // 2. Create the cutting plane (normal along X axis)
      const origin = new oc.gp_Pnt(x, 0, 0);
      const normal = new oc.gp_Dir(1, 0, 0);
      const plane = new oc.gp_Pln(origin, normal);

      // 3. Compute the section using BRepAlgoAPI_Section
      const section = new oc.BRepAlgoAPI_Section(shape, plane, false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (section.Build as any)();

      if (!section.IsDone()) {
        console.warn('[OCCT:section] Section computation failed');
        return;
      }

      const sectionShape = section.Shape();

      // 4. Tessellate the section shape (extract edges/wires as lines)
      const vertices: number[] = [];
      const indices: number[] = [];
      let edgeCount = 0;

      // Mesh the section shape to get triangulation on edges
      const mesh = new oc.BRepMesh_IncrementalMesh(sectionShape, 0.1, false, 0.5, false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mesh.Perform as any)();

      // Explore edges of the section shape
      const explorer = new oc.TopExp_Explorer(sectionShape, oc.TopAbs_ShapeEnum.TopAbs_EDGE);

      while (explorer.More()) {
        edgeCount++;
        const edge = oc.TopoDS.Edge(explorer.Current());

        // Get polygon on the edge (triangulation)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const location = new (oc.TopLoc_Location as any)();
        const result = oc.BRep_Tool.PolygonOnTriangulation(edge, location, 0);

        if (result && result.P && result.T) {
          const polygon: Poly_PolygonOnTriangulation = result.P;
          const triangulation: Poly_Triangulation = result.T;
          const nbNodes = polygon.NbNodes();

          if (nbNodes >= 2) {
            const offset = vertices.length / 3;

            // Extract vertices using indices from polygon
            for (let i = 1; i <= nbNodes; i++) {
              const nodeIndex = polygon.Node(i); // returns index into triangulation nodes
              const node = triangulation.Node(nodeIndex); // returns gp_Pnt
              vertices.push(node.X(), node.Y(), node.Z());
              node.delete();
            }

            // Create line segments (edge segments)
            for (let i = 1; i < nbNodes; i++) {
              indices.push(offset + i - 1, offset + i);
            }
          }

          polygon.delete();
          triangulation.delete();
        } else if (result && result.P) {
          result.P.delete();
        } else if (result && result.T) {
          result.T.delete();
        }

        explorer.Next();
      }

      if (vertices.length === 0) {
        console.warn('[OCCT:section] No edges found in section');
        return;
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geom.setIndex(indices);

      console.log('[OCCT:section] Section computed', {
        vertices: vertices.length / 3,
        indices: indices.length,
        edges: edgeCount,
        position,
        x,
      });

      setSectionGeometry(geom);
    } catch (err) {
      console.error('[OCCT:section] Error', err);
    }
  }, [enabled, shape, position]);

  // Cleanup when disabled
  React.useEffect(() => {
    if (!enabled) {
      setSectionGeometry(null);
    }
  }, [enabled]);

  if (!sectionGeometry) return null;

  return (
    <>
      <lineSegments geometry={sectionGeometry}>
        <lineBasicMaterial color="red" linewidth={2} />
      </lineSegments>
    </>
  );
}
