import { z } from 'zod';
import { IngestResult } from '../ingest/types';
import { SearchResult } from '../search/types';

export type { IngestResult, SearchResult };

export type ReconstructInput = {
  ingestResult: IngestResult;
  searchResult: SearchResult;
  options?: {
    method?: 'auto' | 'manual';
    targetFormat?: 'stl' | 'step' | 'iges';
  };
};

export type ReconstructCandidate = {
  id: string;
  method: 'web_found' | 'local_found' | 'generated';
  fileUrl: string;
  format: string;
  confidence: number;
  warnings: string[];
};

export type ReconstructResult = {
  candidates: ReconstructCandidate[];
  reconstructStatus: 'success' | 'partial' | 'failed';
  warnings: string[];
};

export const reconstructInputSchema = z.object({
  ingestResult: z.any(),
  searchResult: z.any(),
  options: z
    .object({
      method: z.enum(['auto', 'manual']).optional(),
      targetFormat: z.enum(['stl', 'step', 'iges']).optional(),
    })
    .optional(),
});

// --- Paramètres CAO générés par LLM / templates ---

export type CadPartType =
  'cylinder' | 'plate' | 'disc' | 'block' | 'sphere' | 'torus' | 'cone' | 'prism' | 'composite';

export type CadBooleanOperation = 'subtract' | 'union' | 'intersect';

export interface CadComposite {
  base: CadParams;
  tool: CadParams;
  operation: CadBooleanOperation;
}

export type CadParams = {
  type: CadPartType;
  length?: number;
  width?: number;
  depth?: number;
  height?: number;
  diameter?: number;
  radius?: number;
  tubeRadius?: number;
  material?: string;
  unit?: 'mm' | 'cm';
};

export const cadPartTypeSchema = z.enum([
  'cylinder',
  'plate',
  'disc',
  'block',
  'sphere',
  'torus',
  'cone',
  'prism',
]);

export const cadParamsSchema = z.object({
  type: cadPartTypeSchema,
  length: z.number().positive().optional(),
  width: z.number().positive().optional(),
  depth: z.number().positive().optional(),
  height: z.number().positive().optional(),
  diameter: z.number().positive().optional(),
  radius: z.number().positive().optional(),
  tubeRadius: z.number().positive().optional(),
  material: z.string().min(1).optional(),
  unit: z.enum(['mm', 'cm']).optional(),
});
