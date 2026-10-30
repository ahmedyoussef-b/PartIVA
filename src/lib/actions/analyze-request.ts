'use server';

import { getCurrentUser } from '@/lib/auth-server';
import { getRequestById } from '@/lib/data/requests';
import { runEngine, type EngineResult } from '@/core/ai-engine/engine';
import type { IngestInput } from '@/core/ai-engine/skills/ingest/types';

export interface AnalysisSummaryDTO {
  candidatesCount: number;
  bestCandidate: {
    name: string;
    reference: string;
    score: number;
    source: string;
  } | null;
  searchStatus: string;
  reconstructStatus: string;
  reconstructMethod: string | null;
  archiveStatus: string;
  archivedPartId: string | null;
  warnings: string[];
}

export type AnalyzeRequestResponse =
  | {
      ok: true;
      result: AnalysisSummaryDTO;
    }
  | {
      ok: false;
      error: string;
      warnings?: string[];
    };

export async function analyzeRequestWithEngine(
  requestId: string,
): Promise<AnalyzeRequestResponse> {
  try {
    // 1. Contrôle d'authentification et permissions (ADMIN requis)
    const user = await getCurrentUser();
    const role = (user as { role?: string } | null)?.role;
    if (!user || role !== 'ADMIN') {
      return { ok: false, error: 'UNAUTHORIZED' };
    }

    // 2. Chargement de la demande
    if (!requestId || typeof requestId !== 'string') {
      return { ok: false, error: 'INVALID_REQUEST_ID' };
    }
    const request = await getRequestById(requestId);
    if (!request) {
      return { ok: false, error: 'REQUEST_NOT_FOUND' };
    }

    // 3. Normalisation des photos : string ou { url: string } -> URL http(s)
    const normalizedPhotoUrls: string[] = [];
    if (Array.isArray(request.photos)) {
      for (const item of request.photos) {
        if (typeof item === 'string' && (item.startsWith('http://') || item.startsWith('https://'))) {
          normalizedPhotoUrls.push(item);
        } else if (
          item &&
          typeof item === 'object' &&
          'url' in item &&
          typeof (item as { url: unknown }).url === 'string'
        ) {
          const url = (item as { url: string }).url;
          if (url.startsWith('http://') || url.startsWith('https://')) {
            normalizedPhotoUrls.push(url);
          }
        }
      }
    }

    // 4. Construction de IngestInput (pas de cadFiles car non stocké sur Request)
    const input: IngestInput = {
      photos: normalizedPhotoUrls,
      description: request.partDescription || undefined,
    };

    // 5. Exécution du moteur en mode quick
    const engineResult: EngineResult = await runEngine(input, { mode: 'quick' });

    // 6. Extraction du meilleur candidat éventuel
    const firstCandidate = engineResult.search?.candidates?.[0];
    const bestCand = firstCandidate
      ? {
          name: firstCandidate.name || 'Sans nom',
          reference:
            typeof firstCandidate.metadata?.reference === 'string'
              ? firstCandidate.metadata.reference
              : firstCandidate.id,
          score: Math.round((firstCandidate.score || 0) * 100),
          source: firstCandidate.source || 'local',
        }
      : null;

    const reconstructMethod =
      engineResult.reconstruct?.candidates?.[0]?.method ?? null;

    const allWarnings: string[] = [
      ...(engineResult.ingest?.warnings || []),
      ...(engineResult.search?.warnings || []),
      ...(engineResult.reconstruct?.warnings || []),
      ...(engineResult.archive?.warnings || []),
    ];

    // 7. Retour DTO sérialisable minimal
    const summary: AnalysisSummaryDTO = {
      candidatesCount: engineResult.search?.candidates?.length || 0,
      bestCandidate: bestCand,
      searchStatus: engineResult.search?.searchStatus || 'unknown',
      reconstructStatus: engineResult.reconstruct?.reconstructStatus || 'unknown',
      reconstructMethod,
      archiveStatus: engineResult.archive?.archiveStatus || 'unknown',
      archivedPartId: engineResult.archive?.archivedPartId || null,
      warnings: Array.from(new Set(allWarnings)),
    };

    return {
      ok: true,
      result: summary,
    };
  } catch (error) {
    console.error('[analyzeRequestWithEngine] Erreur:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Erreur interne lors de l’analyse',
    };
  }
}
