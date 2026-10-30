import { z } from 'zod';

export type Dimensions = {
  length?: number;
  width?: number;
  height?: number;
  diameter?: number;
  unit: 'mm' | 'cm';
};

export type IngestInput = {
  photos?: (File | string)[];
  cadFiles?: (File | string)[];
  dimensions?: Dimensions;
  description?: string;
};

export type IngestResult = {
  inputType: 'photo_only' | 'photo_dimensions' | 'photo_pro_file' | 'mixed';
  metadata: {
    fileCount: number;
    formats: string[];
    totalSize: number;
    dimensions?: Dimensions;
    detectedType?: string | null;
  };
  extractedFeatures: string[];
  analysisStatus: 'complete' | 'partial' | 'failed';
  warnings: string[];
};

export const dimensionsSchema = z.object({
  length: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  diameter: z.number().optional(),
  unit: z.enum(['mm', 'cm']),
});

export const ingestInputSchema = z.object({
  photos: z.array(z.any()).optional(),
  cadFiles: z.array(z.any()).optional(),
  dimensions: dimensionsSchema.optional(),
  description: z.string().optional(),
});
