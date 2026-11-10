import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ImportCadClient from './import-cad-client';

export const dynamic = 'force-dynamic';

export default async function ImportCadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const request = await prisma.request.findUnique({
    where: { id },
    select: {
      id: true,
      partDescription: true,
      machineRef: true,
      cadFiles: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          url: true,
          fileType: true,
          sizeBytes: true,
          createdAt: true,
        },
      },
    },
  });

  if (!request) {
    notFound();
  }

  return <ImportCadClient requestId={request.id} initialFiles={request.cadFiles} />;
}
