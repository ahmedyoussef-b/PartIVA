import { z } from 'zod';
import { PART_STATUS_VALUES } from '@/lib/search-constants';

export const SearchSourceSchema = z.enum([
  'local_db',
  'traceparts',
  'tecdoc',
  'cadenas',
  'wikidata',
  'manufacturer_catalog',
  'geometric_search',
  'industrial_catalog',
]);
export type SearchSource = z.infer<typeof SearchSourceSchema>;

export const CandidateScoresSchema = z.object({
  global: z.number().min(0).max(1),
  geometry: z.number().min(0).max(1).optional(),
  dimensions: z.number().min(0).max(1).optional(),
  material: z.number().min(0).max(1).optional(),
});
export type CandidateScores = z.infer<typeof CandidateScoresSchema>;

export const SearchCandidateSchema = z.object({
  id: z.string(),
  source: SearchSourceSchema,
  reference: z.string(),
  name: z.string(),
  manufacturer: z.string().optional(),
  imageUrl: z.string().optional(),
  cadAvailable: z.boolean().default(false),
  datasheetAvailable: z.boolean().default(false),
  scores: CandidateScoresSchema,
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type SearchCandidate = z.infer<typeof SearchCandidateSchema>;

export const SearchQuerySchema = z.object({
  requestId: z.string().optional(),
  query: z.string().optional(),
  material: z.string().optional(),
  limit: z.number().int().positive().default(20),
});
export type SearchQuery = z.infer<typeof SearchQuerySchema>;

export const PartSearchQuerySchema = z
  .object({
    q: z.string().min(2).max(200).optional(),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .nullish()
      .transform((v) => v ?? undefined)
      .default(20),
    mode: z.enum(['text', 'reference', 'specs', 'dimensions']).nullish().default('text'),
    key: z
      .string()
      .min(1)
      .max(50)
      .nullish()
      .transform((v) => v ?? undefined),
    min: z.coerce
      .number()
      .nullish()
      .transform((v) => v ?? undefined),
    max: z.coerce
      .number()
      .nullish()
      .transform((v) => v ?? undefined),
    matchMode: z.enum(['nominal', 'tolerance']).nullish().default('nominal'),
    machineId: z.string().cuid().optional(),
    material: z.string().min(1).max(100).optional(),
    status: z.enum(PART_STATUS_VALUES).optional(),
    createdAfter: z.string().datetime().optional(),
    createdBefore: z.string().datetime().optional(),
    minScore: z.coerce.number().min(0).max(1).optional(),
    sort: z.enum(['relevance', 'date', 'name', 'status']).optional().default('relevance'),
    offset: z.coerce.number().int().min(0).optional().default(0),
  })
  .superRefine((data, ctx) => {
    if (data.mode === 'dimensions') {
      if (data.min === undefined && data.max === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'min or max is required when mode=dimensions',
          path: ['min'],
        });
      }
    } else if (data.q === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'q is required when mode is not dimensions',
        path: ['q'],
      });
    }
  });
export type PartSearchQuery = z.infer<typeof PartSearchQuerySchema>;

export const MultiSearchQuerySchema = z
  .object({
    q: z.string().min(2).max(200).optional(),
    reference: z.string().min(2).max(200).optional(),
    specs: z.string().min(2).max(200).optional(),
    specKey: z.string().min(1).max(50).optional(),
    min: z.coerce.number().optional(),
    max: z.coerce.number().optional(),
    dimensionKey: z.string().min(1).max(50).optional(),
    matchMode: z.enum(['nominal', 'tolerance']).optional().default('nominal'),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .nullish()
      .transform((v) => v ?? undefined)
      .default(20),
    // Filtres avancés (E12-R1b)
    material: z.string().min(1).max(100).optional(),
    status: z.enum(PART_STATUS_VALUES).optional(), // aligné PartStatus (D-E12-STATUS-ENUM → clôturée E12-R1d)
    createdAfter: z.string().datetime().optional(),
    createdBefore: z.string().datetime().optional(),
    minScore: z.coerce.number().min(0).max(1).optional(),
    // Tri + pagination (E12-R1b)
    sort: z.enum(['relevance', 'date', 'name', 'status']).optional().default('relevance'),
    offset: z.coerce.number().int().min(0).optional().default(0),
    machineId: z.string().cuid().optional(),
  })
  .superRefine((data, ctx) => {
    const hasAny =
      data.q !== undefined ||
      data.reference !== undefined ||
      data.specs !== undefined ||
      data.min !== undefined ||
      data.max !== undefined;
    if (!hasAny) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Au moins un critère est requis (q, reference, specs, min ou max)',
        path: ['q'],
      });
    }
  });
export type MultiSearchQuery = z.infer<typeof MultiSearchQuerySchema>;

export const MeasuresSchema = z.object({
  length: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  innerDiameter: z.number().optional(),
  outerDiameter: z.number().optional(),
  wallThickness: z.number().optional(),
  pitch: z.number().optional(),
  teethCount: z.number().optional(),
  tolerances: z.record(z.string(), z.string()).optional(),
  notes: z.string().optional(),
});
export type Measures = z.infer<typeof MeasuresSchema>;

export const SyncStatusSchema = z.object({
  lastSyncAt: z.string().nullable(),
  pendingCount: z.number().int().nonnegative(),
  cursor: z.number().int().optional(),
  status: z.enum(['idle', 'syncing', 'error']),
  errorMessage: z.string().optional(),
});
export type SyncStatus = z.infer<typeof SyncStatusSchema>;
