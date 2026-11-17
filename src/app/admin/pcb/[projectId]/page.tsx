import { prisma } from '@/lib/prisma';
import CompliancePanel from '@/components/pcb/CompliancePanel';
import SourcingTable from '@/components/pcb/SourcingTable';
import DesignReviewPanel from '@/components/pcb/DesignReviewPanel';
import { sourceBom } from '@/lib/pcb/sourcing-engine';
import { analyzeRealState } from '@/lib/pcb/simulation';

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
      components: true,
      nets: true,
    },
  });

  if (!project) {
    return <div className="p-6 text-red-600">Projet introuvable : {projectId}</div>;
  }

  const [sourcingResults, complianceResult] = await Promise.all([
    sourceBom(
      project.components.map((c) => ({
        reference: c.reference,
        mpn: c.catalogId ?? undefined,
        description: c.name,
        quantity: 1,
      })),
    ),
    Promise.resolve(
      analyzeRealState(
        project.components.map((c) => ({
          id: c.reference,
          footprint: c.footprint ?? undefined,
        })),
        project.nets.map((n) => ({
          name: n.name,
          pins: [],
          vias: [],
        })),
      ),
    ),
  ]);

  const criticalCount = complianceResult.violations.filter((v) => v.severity === 'CRITICAL').length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            ID: {projectId} • {project.components.length} composants • {project.nets.length} réseaux
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            complianceResult.isCompliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {complianceResult.isCompliant ? 'CONFORME' : `${criticalCount} CRITIQUE(S)`}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Zone principale : Layout PCB */}
        <div className="flex min-h-[500px] flex-col rounded-lg border bg-white p-6 xl:col-span-2">
          <h2 className="mb-4 font-semibold text-gray-800">Layout PCB</h2>
          <div className="flex flex-1 items-center justify-center rounded border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400">
            Visualiseur PCB / Éditeur (à implémenter)
          </div>
        </div>

        {/* Panneaux latéraux empilés */}
        <div className="space-y-6">
          <div className="overflow-hidden rounded-lg border bg-white">
            <div className="border-b bg-gray-50 p-3 text-sm font-semibold text-gray-700">
              Conformité Physique
            </div>
            <div className="p-4">
              <CompliancePanel projectId={projectId} initialResult={complianceResult} />
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border bg-white">
            <div className="border-b bg-gray-50 p-3 text-sm font-semibold text-gray-700">
              Approvisionnement
            </div>
            <div className="p-4">
              <SourcingTable results={sourcingResults} />
            </div>
          </div>

          <DesignReviewPanel projectId={projectId} />
        </div>
      </div>
    </div>
  );
}
