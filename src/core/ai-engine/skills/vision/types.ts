export interface VisionInput {
  photoUrls: string[];
}

import { EngineWarning } from '../reconstruct/types';
export interface VisionResult {
  detectedType: string | null;
  confidence: number;
  rawResponse: string;
  warnings: string[];
  structuredWarnings?: EngineWarning[];
}
