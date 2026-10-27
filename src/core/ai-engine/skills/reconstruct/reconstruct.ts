import { ReconstructInput, ReconstructResult } from './types';
import { selectCandidates } from './select-candidates';

export async function reconstructPart(input: ReconstructInput): Promise<ReconstructResult> {
  try {
    const candidates = await selectCandidates(input.searchResult, input.options, input.ingestResult);
    const warnings: string[] = [];

    const hasValidFile = candidates.some((c) => c.method !== 'generated' && c.fileUrl && c.fileUrl.length > 0);

    if (hasValidFile) {
      return {
        candidates,
        reconstructStatus: 'success',
        warnings,
      };
    }

    if (candidates.some((c) => c.method === 'generated')) {
      warnings.push('Aucun fichier 3D trouvé. Une reconstruction manuelle est nécessaire.');
      return {
        candidates,
        reconstructStatus: 'partial',
        warnings,
      };
    }

    return {
      candidates: [],
      reconstructStatus: 'failed',
      warnings: ['Échec de la reconstruction. Aucun candidat disponible.'],
    };
  } catch {
    return {
      candidates: [],
      reconstructStatus: 'failed',
      warnings: ['reconstruct_failed'],
    };
  }
}
