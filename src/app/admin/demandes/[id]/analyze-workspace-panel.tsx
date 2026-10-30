'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, AlertTriangle, Layers, Database } from 'lucide-react';
import { toast } from 'sonner';
import { analyzeRequestWithEngine, type AnalysisSummaryDTO } from '@/lib/actions/analyze-request';

interface AnalyzeWorkspacePanelProps {
  requestId: string;
}

export function AnalyzeWorkspacePanel({ requestId }: AnalyzeWorkspacePanelProps) {
  const [isPending, startTransition] = React.useTransition();
  const [open, setOpen] = React.useState(false);
  const [analysisResult, setAnalysisResult] = React.useState<AnalysisSummaryDTO | null>(null);

  const handleRunAnalysis = () => {
    startTransition(async () => {
      try {
        const res = await analyzeRequestWithEngine(requestId);
        if (!res.ok) {
          toast.error(res.error || 'Échec de l’analyse Workspace');
          return;
        }
        setAnalysisResult(res.result);
        setOpen(true);
        toast.success('Analyse Workspace terminée');
      } catch (err) {
        console.error('[AnalyzeWorkspacePanel] Erreur:', err);
        toast.error(err instanceof Error ? err.message : 'Erreur inattendue');
      }
    });
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={handleRunAnalysis}
        disabled={isPending}
        className="gap-2 font-semibold shadow-xs"
        data-testid="analyze-workspace-button"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Analyse en cours…</span>
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Analyser avec le Workspace</span>
          </>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl" data-testid="analyze-workspace-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              Résultat d’Analyse Workspace
            </DialogTitle>
            <DialogDescription>
              Synthèse automatique générée par le moteur d’ingénierie PartIVA (mode rapide).
            </DialogDescription>
          </DialogHeader>

          {analysisResult && (
            <div className="space-y-4 pt-2 text-sm">
              {/* Statuts principaux */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border bg-muted/40 p-3">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase">
                    Recherche
                  </span>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Badge
                      variant={analysisResult.searchStatus === 'found' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {analysisResult.searchStatus}
                    </Badge>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/40 p-3">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase">
                    Reconstruction
                  </span>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Badge
                      variant={
                        analysisResult.reconstructStatus === 'success' ? 'default' : 'outline'
                      }
                      className="text-xs"
                    >
                      {analysisResult.reconstructStatus}
                    </Badge>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/40 p-3">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase">
                    Archivage
                  </span>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Badge variant="secondary" className="text-xs">
                      {analysisResult.archiveStatus}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Candidats trouvés */}
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-foreground">
                      Candidats géométriques ({analysisResult.candidatesCount})
                    </span>
                  </div>
                  {analysisResult.bestCandidate && (
                    <span className="font-mono text-xs font-bold text-primary">
                      Score max: {analysisResult.bestCandidate.score}%
                    </span>
                  )}
                </div>

                {analysisResult.bestCandidate ? (
                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Meilleur candidat :</span>
                      <span className="font-medium text-foreground">
                        {analysisResult.bestCandidate.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Référence :</span>
                      <span className="font-mono text-foreground">
                        {analysisResult.bestCandidate.reference}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Source :</span>
                      <span className="text-foreground capitalize">
                        {analysisResult.bestCandidate.source}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Aucun candidat géométrique direct trouvé dans le catalogue local.
                  </p>
                )}
              </div>

              {/* Détails techniques */}
              <div className="space-y-2 rounded-lg border bg-card p-4 text-xs">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Database className="h-4 w-4 text-primary" />
                  Détails du pipeline
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-muted-foreground">
                  <div>
                    Méthode reconstruction :{' '}
                    <span className="font-medium text-foreground">
                      {analysisResult.reconstructMethod || 'Standard'}
                    </span>
                  </div>
                  <div>
                    Pièce brouillon créée :{' '}
                    <span className="font-mono text-foreground">
                      {analysisResult.archivedPartId
                        ? analysisResult.archivedPartId.slice(0, 10) + '…'
                        : 'Non'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Avertissements éventuels */}
              {analysisResult.warnings.length > 0 && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-50/50 p-3 text-xs text-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
                  <div className="mb-1 flex items-center gap-1.5 font-semibold">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    Avertissements ({analysisResult.warnings.length})
                  </div>
                  <ul className="list-inside list-disc space-y-0.5 text-[11px] text-muted-foreground">
                    {analysisResult.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button variant="default" size="sm" onClick={() => setOpen(false)}>
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
