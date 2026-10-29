import type { EngineResult } from '@/core/ai-engine/engine';

export type Suggestion = {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'action';
  action?: () => void;
};

export function generateSuggestions(result: EngineResult): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const ingestWarnings = result.ingest?.warnings ?? [];
  if (ingestWarnings.some((w) => /dimension/i.test(w))) {
    suggestions.push({
      id: 'add-dimensions',
      message: 'Ajoutez les dimensions (longueur, largeur, hauteur) pour affiner la recherche.',
      type: 'warning',
    });
  }
  if (result.search?.searchStatus === 'not_found') {
    suggestions.push({
      id: 'try-deep',
      message: 'Essayez le mode approfondi (Deep) pour élargir la recherche au web.',
      type: 'action',
    });
  }
  if (result.reconstruct?.reconstructStatus === 'partial') {
    suggestions.push({
      id: 'no-3d',
      message:
        'Aucun fichier 3D trouvé. Vous pouvez convertir un candidat ou uploader un fichier CAO.',
      type: 'info',
    });
  }
  if (result.archive?.archiveStatus === 'partial') {
    suggestions.push({
      id: 'draft',
      message: 'La pièce est en brouillon. Vérifiez les dimensions ou convertissez un candidat.',
      type: 'info',
    });
  }
  return suggestions;
}
