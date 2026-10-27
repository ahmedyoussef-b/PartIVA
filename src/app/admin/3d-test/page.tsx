import { CadViewer } from '@/components/3d/cad-viewer';

export default function CadViewerTestPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="mb-2 text-2xl font-semibold">Test visualiseur CAD (STEP)</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Banc de test E16-R1 — parsing STEP via occt-import-js (Web Worker).
      </p>
      <CadViewer src="/models/test.step" height={400} />
    </div>
  );
}
