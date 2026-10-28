import { ArchiveInput } from './types';

export function validateArchive(input: ArchiveInput): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (input.reconstructResult.reconstructStatus !== 'success') {
    warnings.push('reconstruct_not_successful');
    return { isValid: false, warnings };
  }

  const candidate = input.reconstructResult.candidates[0];
  if (!candidate || !candidate.fileUrl || candidate.fileUrl.length === 0) {
    warnings.push('missing_file_url');
    return { isValid: false, warnings };
  }

  if (input.ingestResult.metadata.dimensions) {
    const d = input.ingestResult.metadata.dimensions;
    const values = [d.length, d.width, d.height, d.diameter].filter(
      (v): v is number => typeof v === 'number',
    );
    if (values.some((v) => v < 1)) {
      warnings.push('dimension_too_small');
    }
    if (values.some((v) => v > 500)) {
      warnings.push('dimension_too_large');
    }
  }

  if (
    warnings.length > 0 &&
    warnings.some((w) => w === 'dimension_too_small' || w === 'dimension_too_large')
  ) {
    return { isValid: true, warnings };
  }

  return { isValid: true, warnings: [] };
}
