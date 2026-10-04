import { z } from 'zod'

export const SearchSourceSchema = z.enum([
  'local_db',
  'traceparts',
  'cadenas',
  'manufacturer_catalog',
  'geometric_search',
])
export type SearchSource = z.infer<typeof SearchSourceSchema>

export const CandidateScoresSchema = z.object({
  global: z.number().min(0).max(1),
  geometry: z.number().min(0).max(1).optional(),
  dimensions: z.number().min(0).max(1).optional(),
  material: z.number().min(0).max(1).optional(),
})
export type CandidateScores = z.infer<typeof CandidateScoresSchema>

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
})
export type SearchCandidate = z.infer<typeof SearchCandidateSchema>

export const SearchQuerySchema = z.object({
  requestId: z.string().optional(),
  query: z.string().optional(),
  material: z.string().optional(),
  limit: z.number().int().positive().default(20),
})
export type SearchQuery = z.infer<typeof SearchQuerySchema>

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
})
export type Measures = z.infer<typeof MeasuresSchema>

export const SyncStatusSchema = z.object({
  lastSyncAt: z.string().nullable(),
  pendingCount: z.number().int().nonnegative(),
  cursor: z.number().int().optional(),
  status: z.enum(['idle', 'syncing', 'error']),
  errorMessage: z.string().optional(),
})
export type SyncStatus = z.infer<typeof SyncStatusSchema>
