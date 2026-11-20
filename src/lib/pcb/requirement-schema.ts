import { z } from 'zod';

export const PcbEnrichmentSchema = z.object({
  enrichments: z.array(
    z.object({
      questionId: z.string().min(1),
      suggestion: z.string(),
      status: z.enum(['proposed', 'confirmed', 'to_verify', 'missing']).default('proposed'),
    }),
  ),
});

export type PcbEnrichmentOutput = z.infer<typeof PcbEnrichmentSchema>;

export const PcbRequirementSchema = z.object({
  requirements: z.array(
    z.object({
      category: z.enum(['usage', 'function', 'processing', 'mechanical', 'manufacturing', 'quality']),
      key: z.string().min(1),
      value: z.string(),
      status: z.enum(['proposed', 'confirmed', 'to_verify', 'missing']).default('proposed'),
    }),
  ),
});

export type PcbRequirementOutput = z.infer<typeof PcbRequirementSchema>;