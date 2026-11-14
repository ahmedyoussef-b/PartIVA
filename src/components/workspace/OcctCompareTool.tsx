'use client';

import * as React from 'react';
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

  return (
    <>
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
