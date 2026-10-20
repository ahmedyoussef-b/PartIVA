import { CadViewer } from '@/components/3d/cad-viewer';

export default function CadViewerTimeoutTestPage() {
  return (
    <div className="container mx-auto py-6" data-testid="cad-viewer-timeout-test-page">
      <h1 className="mb-2 text-2xl font-semibold">Test visualiseur CAD (Timeout)</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Banc de test E16-R2 — vérification du timeout de parsing (2 s).
      </p>
      <CadViewer src="/models/test.iges" height={400} timeoutMs={2000} maxSizeMb={50} />
    </div>
  );
}
