export interface VisionInput {
  photoUrls: string[];
}

export interface VisionResult {
  detectedType: string | null;
  confidence: number;
  rawResponse: string;
  warnings: string[];
}