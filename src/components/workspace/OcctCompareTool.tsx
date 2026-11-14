'use client';

import * as React from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import oc from 'libcascade';
import type { TopoDS_Shape } from 'libcascade';
import { importCadFile } from '@/lib/occt/import-step';
import { tessellateShape } from '@/lib/occt/tessellate';

/**
 * OcctCompareTool — comparaison booléenne entre deux fichiers CAO (STEP/IGES).
 *
 * Charge les deux fichiers via `importCadFile`, puis calcule :
 *  - Cut    (uploadé − candidat)   → rendu orange,
 *  - Common (intersection)        → rendu vert,
 *  - uploadé                      → rendu rouge translucide,
 *  - candidat                     → rendu bleu translucide.
 *
 * Le composant rend des meshes R3F : il doit être monté à l'intérieur d'un
 * <Canvas> (parent type OcctViewer). Il retourne `null` pendant le calcul
 * (pas de HTML dans un Canvas R3F).
 */
interface OcctCompareToolProps {
  /** URL du fichier uploadé (STEP/IGES) */
  uploadedUrl: string;
  /** Nom du fichier uploadé (détermine le format) */
  uploadedName: string;
  /** URL du fichier candidat (STEP/IGES) */
  candidateUrl: string;
  /** Nom du fichier candidat (détermine le format) */
  candidateName: string;
}

function formatFromName(name: string): 'step' | 'iges' {
  const lower = name.toLowerCase();
  return lower.endsWith('.step') || lower.endsWith('.stp') ? 'step' : 'iges';
}

function booleanCut(s1: TopoDS_Shape, s2: TopoDS_Shape): TopoDS_Shape {
  const cut = new oc.BRepAlgoAPI_Cut(s1, s2);
  if (!cut.IsDone()) {
    cut.Build();
  }
  if (!cut.IsDone()) {
    throw new Error('BRepAlgoAPI_Cut a échoué');
  }
  return cut.Shape();
}

function booleanCommon(s1: TopoDS_Shape, s2: TopoDS_Shape): TopoDS_Shape {
  const common = new oc.BRepAlgoAPI_Common(s1, s2);
  if (!common.IsDone()) {
    common.Build();
  }
  if (!common.IsDone()) {
    throw new Error('BRepAlgoAPI_Common a échoué');
  }
  return common.Shape();
}

/**
 * Calcule la bounding sphere de l'union des géométries (uploaded + candidat + cut + common).
 * Permet de recentrer la caméra pour que tout soit visible.
 */
function unionBoundingSphere(geometries: Array<THREE.BufferGeometry | null>): THREE.Sphere | null {
  const sphere = new THREE.Sphere();
  let found = false;
  for (const g of geometries) {
    if (!g) continue;
    g.computeBoundingSphere();
    const gs = g.boundingSphere;
    if (!gs || gs.radius === 0) continue;
    if (!found) {
      sphere.copy(gs);
      found = true;
    } else {
      sphere.union(gs);
    }
  }
  return found ? sphere : null;
}

/**
 * Repositionne la caméra pour que la bounding sphere soit entièrement visible.
 * distance = radius * 3, centre = centre de la bounding sphere.
 */
function fitCameraToSphere(
  camera: THREE.Camera & { updateProjectionMatrix: () => void },
  controls: unknown,
  sphere: THREE.Sphere,
): void {
  const center = sphere.center;
  const radius = sphere.radius;
  const distance = radius * 3;
  camera.position.set(center.x + distance, center.y + distance, center.z + distance);
  camera.lookAt(center);
  camera.updateProjectionMatrix();
  if (controls && typeof controls === 'object' && 'target' in controls) {
    const c = controls as unknown as { target: THREE.Vector3; update: () => void };
    c.target.copy(center);
    c.update();
  }
}

/**
 * Composant enfant du `<Canvas>` (utilise `useThree`) qui auto-fit la caméra
 * sur l'union des géométries une fois celles-ci chargées.
 */
function FitCamera({ geometries }: { geometries: Array<THREE.BufferGeometry | null> }) {
  const { camera, controls } = useThree();
  const sphere = React.useMemo(() => unionBoundingSphere(geometries), [geometries]);

  React.useEffect(() => {
    if (!sphere || sphere.radius === 0) return;
    fitCameraToSphere(camera, controls, sphere);
  }, [sphere, camera, controls]);

  return null;
}

export function OcctCompareTool({
  uploadedUrl,
  uploadedName,
  candidateUrl,
  candidateName,
}: OcctCompareToolProps) {
  const [uploadedGeom, setUploadedGeom] = React.useState<THREE.BufferGeometry | null>(null);
  const [candidateGeom, setCandidateGeom] = React.useState<THREE.BufferGeometry | null>(null);
  const [cutGeom, setCutGeom] = React.useState<THREE.BufferGeometry | null>(null);
  const [commonGeom, setCommonGeom] = React.useState<THREE.BufferGeometry | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Charge les deux fichiers, calcule Cut/Common et tesselle les résultats.
  React.useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        console.log('[OCCT:compare] Chargement', { uploadedUrl, candidateUrl });
        const [uploadedRes, candidateRes] = await Promise.all([
          fetch(uploadedUrl).then((r) => r.arrayBuffer()),
          fetch(candidateUrl).then((r) => r.arrayBuffer()),
        ]);

        const uploadedImport = importCadFile(uploadedRes, formatFromName(uploadedName));
        const candidateImport = importCadFile(candidateRes, formatFromName(candidateName));

        if (!uploadedImport.success || !uploadedImport.shape) {
          throw new Error(`Import uploadé échoué : ${uploadedImport.error ?? 'inconnu'}`);
        }
        if (!candidateImport.success || !candidateImport.shape) {
          throw new Error(`Import candidat échoué : ${candidateImport.error ?? 'inconnu'}`);
        }

        const uploadedShape = uploadedImport.shape;
        const candidateShape = candidateImport.shape;

        const uploadedG = tessellateShape(uploadedShape);
        const candidateG = tessellateShape(candidateShape);
        const cutG = tessellateShape(booleanCut(uploadedShape, candidateShape));
        const commonG = tessellateShape(booleanCommon(uploadedShape, candidateShape));

        if (!mounted) {
          uploadedG.dispose();
          candidateG.dispose();
          cutG.dispose();
          commonG.dispose();
          return;
        }

        setUploadedGeom(uploadedG);
        setCandidateGeom(candidateG);
        setCutGeom(cutG);
        setCommonGeom(commonG);
        setLoading(false);
        console.log('[OCCT:compare] Comparaison calculée');
      } catch (err) {
        console.error('[OCCT:compare] Erreur', err);
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [uploadedUrl, candidateUrl, uploadedName, candidateName]);

  // Libère les géométries remplacées / au démontage.
  React.useEffect(() => {
    return () => {
      uploadedGeom?.dispose();
      candidateGeom?.dispose();
      cutGeom?.dispose();
      commonGeom?.dispose();
    };
  }, [uploadedGeom, candidateGeom, cutGeom, commonGeom]);

  if (loading) {
    return null;
  }

  const geometries = [uploadedGeom, candidateGeom, cutGeom, commonGeom];

  return (
    <>
      <FitCamera geometries={geometries} />
      {uploadedGeom && (
        <mesh geometry={uploadedGeom}>
          <meshStandardMaterial color="red" opacity={0.5} transparent />
        </mesh>
      )}
      {candidateGeom && (
        <mesh geometry={candidateGeom}>
          <meshStandardMaterial color="blue" opacity={0.5} transparent />
        </mesh>
      )}
      {cutGeom && (
        <mesh geometry={cutGeom}>
          <meshStandardMaterial color="orange" opacity={0.9} />
        </mesh>
      )}
      {commonGeom && (
        <mesh geometry={commonGeom}>
          <meshStandardMaterial color="green" opacity={0.9} />
        </mesh>
      )}
    </>
  );
}
