import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ImportCadClient from './import-cad-client';

export const dynamic = 'force-dynamic';

export default async function ImportCadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sequential?: string }>;
}) {
  const { id } = await params;
  const { sequential } = await searchParams;
  const isSequential = sequential === '1';

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

  return (
    <ImportCadClient
      requestId={request.id}
      initialFiles={request.cadFiles}
      isSequential={isSequential}
    />
  );
}
