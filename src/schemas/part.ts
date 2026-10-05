import { z } from 'zod';

export const MaterialSchema = z.enum([
  'POM-C',
  'POM-H',
  'PA6',
  'PA66',
  'PEHD',
  'PEBD',
  'PTFE',
  'UHMW-PE',
  'PVC',
  'PEEK',
  'ABS',
  'PETP',
]);
export type Material = z.infer<typeof MaterialSchema>;

export const PartDimensionsSchema = z.object({
  length: z.number().positive().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  diameter: z.number().positive().optional(),
  weight: z.number().positive().optional(),
});
export type PartDimensions = z.infer<typeof PartDimensionsSchema>;

export const PartSchema = z.object({
  id: z.string().uuid(),
  reference: z.string().regex(/^PL-\d{6}$/),
  name: z.string().min(3).max(200),
  description: z.string().optional(),
  material: MaterialSchema,
  dimensions: PartDimensionsSchema,
  tolerances: z.record(z.string(), z.string()).optional(),
  version: z.string().default('V1'),
  status: z.enum(['draft', 'validated', 'deprecated']).default('draft'),
  files: z.object({
    cad: z.array(z.string()).default([]),
    plans: z.array(z.string()).default([]),
    photos: z.array(z.string()).default([]),
  }),
  machineId: z.string().uuid().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Part = z.infer<typeof PartSchema>;

export const PartRelationSchema = z.object({
  id: z.string().uuid(),
  sourceId: z.string().uuid(),
  targetId: z.string().uuid(),
  relationType: z.enum(['replaces', 'similar_to', 'used_in', 'derived_from']),
  score: z.number().min(0).max(1).optional(),
  notes: z.string().optional(),
});
export type PartRelation = z.infer<typeof PartRelationSchema>;

export const PartFiltersSchema = z.object({
  query: z.string().optional(),
  material: MaterialSchema.optional(),
  status: z.enum(['draft', 'validated', 'deprecated']).optional(),
  machineId: z.string().optional(),
});
export type PartFilters = z.infer<typeof PartFiltersSchema>;

export const NewPartSchema = PartSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type NewPart = z.infer<typeof NewPartSchema>;

export const UpdatePartSchema = NewPartSchema.partial();
export type UpdatePart = z.infer<typeof UpdatePartSchema>;
