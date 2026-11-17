import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PcbProjectWorkspace } from '@/components/pcb/PcbProjectWorkspace';

export const dynamic = 'force-dynamic';

export default async function PcbProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const project = await prisma.pcbProject.findUnique({
    where: { id: projectId },
    include: {
      requirements: true,
      components: true,
      nets: true,
      proposals: true,
      checkpoints: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <PcbProjectWorkspace project={JSON.parse(JSON.stringify(project))} />
    </main>
  );
}