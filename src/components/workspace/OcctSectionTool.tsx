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
    console.log('[OCCT:section] Effect running', { enabled, hasShape: !!shape, position });
    if (!enabled || !shape) {
      return;
    }

    try {
      console.log('[OCCT:section] Computing bbox...');
      // 1. Compute bounding box to position the plane
      const bbox = new oc.Bnd_Box();
      oc.BRepBndLib.Add(shape, bbox, true);

      if (bbox.IsVoid()) {
        console.warn('[OCCT:section] Bbox is void');
        return;
      }

      const xmin = bbox.CornerMin().X();
      const xmax = bbox.CornerMax().X();
      const x = xmin + (xmax - xmin) * position;
      console.log('[OCCT:section] Bbox computed', { xmin, xmax, x, position });

      // 2. Create the cutting plane (normal along X axis)
      console.log('[OCCT:section] Creating plane...');
      const origin = new oc.gp_Pnt(x, 0, 0);
      const normal = new oc.gp_Dir(1, 0, 0);
      const plane = new oc.gp_Pln(origin, normal);

      // 3. Compute the section using BRepAlgoAPI_Section
      console.log('[OCCT:section] Computing section...');
      const section = new oc.BRepAlgoAPI_Section(shape, plane, false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (section.Build as any)();

      if (!section.IsDone()) {
        console.warn('[OCCT:section] Section computation failed');
        return;
      }

      const sectionShape = section.Shape();
      console.log('[OCCT:section] Section shape obtained', {
        shapeType: sectionShape.ShapeType(),
        isNull: sectionShape.IsNull(),
      });

      // 4. Tessellate the section shape (extract edges/wires as lines)
      console.log('[OCCT:section] Tessellating section shape...');
      const vertices: number[] = [];
      const indices: number[] = [];
      let edgeCount = 0;

      // Mesh the section shape to get triangulation on edges
      const mesh = new oc.BRepMesh_IncrementalMesh(sectionShape, 0.1, false, 0.5, false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mesh.Perform as any)();
      console.log('[OCCT:section] Mesh performed');

      // Use TopExp::MapShapes to recursively find all edges in the compound
      const edgeMap = new oc.NCollection_IndexedMap_TopoDS_Shape_TopTools_ShapeMapHasher();
      oc.TopExp.MapShapes(sectionShape, oc.TopAbs_ShapeEnum.TopAbs_EDGE, edgeMap);
      edgeCount = edgeMap.Extent();
      console.log('[OCCT:section] MapShapes found edges', { edgeCount });

      for (let i = 1; i <= edgeCount; i++) {
        const edge = oc.TopoDS.Edge(edgeMap.FindKey(i));

        // Try to get polygon from existing triangulation first
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
            for (let j = 1; j <= nbNodes; j++) {
              const nodeIndex = polygon.Node(j); // returns index into triangulation nodes
              const node = triangulation.Node(nodeIndex); // returns gp_Pnt
              vertices.push(node.X(), node.Y(), node.Z());
              node.delete();
            }

            // Create line segments (edge segments)
            for (let j = 1; j < nbNodes; j++) {
              indices.push(offset + j - 1, offset + j);
            }
          }

          polygon.delete();
          triangulation.delete();
        } else {
          // Fallback: discretize the edge using BRepAdaptor_Curve
          console.log('[OCCT:section] No triangulation on edge, discretizing curve...');
          try {
            const adaptor = new oc.BRepAdaptor_Curve(edge);
            const firstParam = adaptor.FirstParameter();
            const lastParam = adaptor.LastParameter();
            const numSegments = 20;
            const offset = vertices.length / 3;

            for (let seg = 0; seg <= numSegments; seg++) {
              const param = firstParam + ((lastParam - firstParam) * seg) / numSegments;
              const point = new oc.gp_Pnt();
              adaptor.D0(param, point);
              vertices.push(point.X(), point.Y(), point.Z());
            }

            // Create line segments
            for (let seg = 0; seg < numSegments; seg++) {
              indices.push(offset + seg, offset + seg + 1);
            }
            console.log('[OCCT:section] Curve discretized', { segments: numSegments });
          } catch (curveErr) {
            console.warn('[OCCT:section] Curve discretization failed', curveErr);
          }
        }
        // Cleanup result if it had partial data
        if (result) {
          if (result.P) {
            result.P.delete();
          } else if (result.T) {
            result.T.delete();
          }
        }
      }

      console.log('[OCCT:section] Exploration complete', {
        edgeCount,
        vertices: vertices.length / 3,
      });

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
