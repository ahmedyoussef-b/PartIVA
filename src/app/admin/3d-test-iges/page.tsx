import { CadViewer } from '@/components/3d/cad-viewer';

export default function CadViewerIgesTestPage() {
  return (
    <div className="container mx-auto py-6" data-testid="cad-viewer-iges-test-page">
      <h1 className="mb-2 text-2xl font-semibold">Test visualiseur CAD (IGES)</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Banc de test E16-R2 — parsing IGES via occt-import-js (Web Worker).
      </p>
      <CadViewer src="/models/test.iges" height={400} maxSizeMb={50} />
    </div>
  );
}
