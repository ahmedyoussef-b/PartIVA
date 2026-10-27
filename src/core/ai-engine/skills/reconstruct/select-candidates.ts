import { ReconstructCandidate, ReconstructInput, SearchResult, IngestResult } from './types';
import { extractCadParams } from './extract-params';
import { generateCadFromParams } from './generate-cad';

const FALLBACK_INGEST: IngestResult = {
  inputType: 'photo_dimensions',
  metadata: { fileCount: 0, formats: [], totalSize: 0 },
  extractedFeatures: [],
  analysisStatus: 'complete',
  warnings: [],
};

function isValid3DFile(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.endsWith('.stl') || lower.endsWith('.step') || lower.endsWith('.stp') || lower.endsWith('.iges') || lower.endsWith('.igs');
}

function getFormat(url: string): string {
  const lower = url.toLowerCase();
  if (lower.endsWith('.step') || lower.endsWith('.stp')) return 'step';
  if (lower.endsWith('.iges') || lower.endsWith('.igs')) return 'iges';
  if (lower.endsWith('.stl')) return 'stl';
  return 'unknown';
}

async function createGeneratedCandidate(
  ingestResult: IngestResult,
  options?: ReconstructInput['options'],
): Promise<ReconstructCandidate> {
  try {
    const params = await extractCadParams(ingestResult);
    return await generateCadFromParams(params);
  } catch {
    return {
      id: 'generated-1',
      method: 'generated',
      fileUrl: '',
      format: options?.targetFormat || 'stl',
      confidence: 0.3,
      warnings: ['Aucun fichier 3D trouvé. Une reconstruction manuelle est nécessaire.'],
    };
  }
}

export async function selectCandidates(
  searchResult: SearchResult,
  options?: ReconstructInput['options'],
  ingestResult?: IngestResult,
): Promise<ReconstructCandidate[]> {
  const candidates: ReconstructCandidate[] = [];

  if (searchResult.searchStatus === 'found') {
    for (const item of searchResult.candidates) {
      if (item.fileUrl && isValid3DFile(item.fileUrl)) {
        candidates.push({
          id: item.id,
          method: item.source === 'local' ? 'local_found' : 'web_found',
          fileUrl: item.fileUrl,
          format: getFormat(item.fileUrl),
          confidence: Math.min(1, item.score + 0.1),
          warnings: [],
        });
      }
    }
  }

  if (candidates.length === 0) {
    if (searchResult.searchStatus === 'partial' || searchResult.searchStatus === 'not_found') {
      candidates.push(await createGeneratedCandidate(ingestResult ?? FALLBACK_INGEST, options));
    } else {
      candidates.push({
        id: 'generated-1',
        method: 'generated',
        fileUrl: '',
        format: options?.targetFormat || 'stl',
        confidence: 0.3,
        warnings: ['Aucun fichier 3D trouvé. Une reconstruction manuelle est nécessaire.'],
      });
    }
  }

  candidates.sort((a, b) => b.confidence - a.confidence);
  return candidates;
}

