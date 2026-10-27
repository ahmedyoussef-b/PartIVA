import { ingestInputSchema, IngestInput, IngestResult } from './types';

export async function ingestInput(input: IngestInput): Promise<IngestResult> {
  try {
    const parsed = ingestInputSchema.parse(input);

    const photos = parsed.photos || [];
    const cadFiles = parsed.cadFiles || [];
    const dimensions = parsed.dimensions;

    const files = [...photos, ...cadFiles];
    const fileCount = files.length;

    const formats: string[] = [];
    let totalSize = 0;

    for (const file of files) {
      if (file && (typeof file === 'string' || typeof file === 'object')) {
        if (typeof file === 'string') {
          const ext = file.split('.').pop()?.split('?')[0];
          if (ext) formats.push(ext.toLowerCase());
        } else if ((file as File).type) {
          formats.push((file as File).type);
        } else if ((file as File).name) {
          const name = (file as File).name;
          const ext = name.split('.').pop();
          if (ext) {
            formats.push(ext.toLowerCase());
          }
        }
        if (typeof (file as File).size === 'number') {
          totalSize += (file as File).size;
        }
      }
    }

    const uniqueFormats = Array.from(new Set(formats));

    let inputType: IngestResult['inputType'] = 'photo_only';
    if (dimensions && fileCount > 0) {
      if (cadFiles.length > 0) {
        inputType = 'mixed';
      } else {
        inputType = 'photo_dimensions';
      }
    } else if (cadFiles.length > 0) {
      inputType = 'photo_pro_file';
    } else if (dimensions && fileCount === 0) {
      inputType = 'photo_dimensions';
    } else {
      inputType = 'photo_only';
    }

    const extractedFeatures: string[] = [];
    if (dimensions) {
      extractedFeatures.push('dimensions_provided');
    }
    if (photos.length > 0) {
      extractedFeatures.push('photos_present');
    }
    if (cadFiles.length > 0) {
      extractedFeatures.push('cad_files_present');
    }
    if (parsed.description) {
      extractedFeatures.push('description_provided');
    }

    const warnings: string[] = [];
    if (fileCount === 0 && !dimensions && !parsed.description) {
      warnings.push('no_input_provided');
    }
    if (photos.length > 0 && !dimensions && cadFiles.length === 0) {
      warnings.push('dimensions_missing_for_photo');
    }
    if (cadFiles.length > 0 && !dimensions) {
      warnings.push('dimensions_recommended_for_cad');
    }

    let analysisStatus: IngestResult['analysisStatus'] = 'complete';
    if (fileCount === 0) {
      analysisStatus = 'failed';
    } else if (inputType === 'photo_only') {
      analysisStatus = 'partial';
    } else {
      analysisStatus = 'complete';
    }

    return {
      inputType,
      metadata: {
        fileCount,
        formats: uniqueFormats,
        totalSize,
        dimensions,
      },
      extractedFeatures,
      analysisStatus,
      warnings,
    };
  } catch (error) {
    return {
      inputType: 'photo_only',
      metadata: {
        fileCount: 0,
        formats: [],
        totalSize: 0,
      },
      extractedFeatures: [],
      analysisStatus: 'failed',
      warnings: ['invalid_input'],
    };
  }
}
