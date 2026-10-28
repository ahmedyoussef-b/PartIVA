/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities */
import { ArchiveInput, ArchiveResult } from './types';
import { validateArchive } from './validate';

const getPrisma = async () => {
  try {
    const mod = await import('@/lib/prisma');
    return mod.prisma;
  } catch {
    return null;
  }
};

export async function archivePart(input: ArchiveInput): Promise<ArchiveResult> {
  try {
    const validation = validateArchive(input);
    const warnings = [...validation.warnings];

    const prisma = await getPrisma();
    if (!prisma) {
      return {
        archivedPartId: null,
        archiveStatus: 'failed',
        warnings: ['prisma_unavailable'],
      };
    }

    const candidate = input.reconstructResult.candidates[0];
    const partNumber = `AUTO-${Date.now()}`;

    try {
      const part = await (prisma as any).part.create({
        data: {
          partNumber,
          name: input.ingestResult.extractedFeatures.includes('description_provided')
            ? 'Partie générée par IA'
            : 'Pièce reconstruite',
          description: input.ingestResult.metadata.dimensions
            ? `Dimensions: ${JSON.stringify(input.ingestResult.metadata.dimensions)}`
            : undefined,
          status: validation.isValid ? 'DRAFT' : 'DRAFT',
          clientId: input.userId || null,
        },
      });

      if (validation.isValid) {
        return {
          archivedPartId: part.id,
          archiveStatus: 'success',
          warnings,
        };
      } else {
        warnings.push('archived_as_draft');
        return {
          archivedPartId: part.id,
          archiveStatus: 'partial',
          warnings,
        };
      }
    } catch (error) {
      return {
        archivedPartId: null,
        archiveStatus: 'failed',
        warnings: ['archive_create_failed'],
      };
    }
  } catch (error) {
    return {
      archivedPartId: null,
      archiveStatus: 'failed',
      warnings: ['archive_failed'],
    };
  }
}
