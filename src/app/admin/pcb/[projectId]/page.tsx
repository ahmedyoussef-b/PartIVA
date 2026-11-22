import { prisma } from '@/lib/prisma';
import CompliancePanel from '@/components/pcb/CompliancePanel';
import SourcingTable from '@/components/pcb/SourcingTable';
import DesignReviewPanel from '@/components/pcb/DesignReviewPanel';
import ExportButtons from '@/components/pcb/ExportButtons';
import VisualComparisonOverlay from '@/components/pcb/VisualComparisonOverlay';
import { WorkspaceBackButton } from './back-button';
import { KicadFileInput } from './kicad-file-input';
import { PcbCanvas } from '@/components/pcb/PcbCanvas';
import { RequirementInput } from './requirement-input';
import { PcbEditorProvider } from '@/components/pcb/PcbEditorProvider';
import { ProposalsPanel } from '@/components/pcb/ProposalsPanel';
import { PlacementPanel } from '@/components/pcb/PlacementPanel';
import { PriceCard } from '@/components/pcb/PriceCard';
import { CapitalizeButton } from '@/components/pcb/CapitalizeButton';
import { computePriceTotal } from '@/lib/pcb/price-total';
import { parseKicadPcb } from '@/lib/pcb/kicad-file-reader';
import fs from 'node:fs';
import path from 'node:path';
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

  const clientRequest = project.requestId
    ? await prisma.request.findUnique({
        where: { id: project.requestId },
        select: { partFunction: true },
      })
    : null;

  // C.2 — dimensions du plateau (repli 100 x 80 mm si fichier absent/illisible)
  let boardWidthMm = 100;
  let boardHeightMm = 80;
  if (project.kicadFilePath) {
    try {
      const abs = path.isAbsolute(project.kicadFilePath)
        ? project.kicadFilePath
        : path.join(process.cwd(), project.kicadFilePath);
      const parsed = parseKicadPcb(fs.readFileSync(abs, 'utf8'));
      if (parsed.dimensions.width > 0) boardWidthMm = parsed.dimensions.width;
      if (parsed.dimensions.height > 0) boardHeightMm = parsed.dimensions.height;
    } catch (e) {
      console.warn('[PCB:PLACEMENT] Dimensions indisponibles', e);
    }
  }

  // V39.1 — coût estimé (PcbComponent sans `quantity` → quantité = 1)
  const priceLines = await prisma.pcbComponent.findMany({
    where: { projectId },
    select: { reference: true, catalogId: true },
  });

  const priceCatalogIds = priceLines
    .map((c) => c.catalogId)
    .filter((value): value is string => Boolean(value));

  const pricedCatalogs =
    priceCatalogIds.length > 0
      ? await prisma.componentCatalog.findMany({
          where: { id: { in: priceCatalogIds } },
          select: {
            id: true,
            prices: {
              orderBy: { updatedAt: 'desc' },
              take: 1,
              select: { price: true, currency: true },
            },
          },
        })
      : [];

  const catalogPrices = pricedCatalogs.map((c) => ({
    catalogId: c.id,
    unitPrice: c.prices[0]?.price ?? null,
    currency: c.prices[0]?.currency ?? undefined,
  }));

  const priceTotal = computePriceTotal(
    priceLines.map((c) => ({ reference: c.reference, catalogId: c.catalogId })),
    catalogPrices,
  );

  const pendingProposals = await prisma.pcbProposal.findMany({
    where: { projectId, status: 'pending' },
    orderBy: { createdAt: 'asc' },
  });

  const serializedProposals = pendingProposals.map((p) => ({
    id: p.id,
    action: p.action,
    target: p.target,
    payload: p.payload,
    reason: p.reason,
    status: p.status,
  }));

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

  // P10 — Branchement des données CAO (champ `cadFileUrl` désormais officiel).
  const cadFileUrl = project.cadFileUrl ?? undefined;
  const comparisonLayers = cadFileUrl
    ? [
        {
          url: cadFileUrl,
          name: project.cadFileName ?? undefined,
          mode: 'original' as const,
          color: '#3B82F6',
        },
      ]
    : undefined;

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-gray-50">
      <div className="flex items-center justify-between gap-3 border-b bg-white px-4 py-2">
        <div className="flex items-center gap-3">
          <WorkspaceBackButton />
          <KicadFileInput projectId={projectId} current={project.kicadFilePath} />
          <div>
            <h1 className="text-lg leading-tight font-bold text-gray-900">{project.name}</h1>
            <p className="text-xs text-gray-500">
              ID: {projectId} • {project.components.length} composants • {project.nets.length}{' '}
              réseaux
            </p>
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            complianceResult.pending
              ? 'bg-gray-100 text-gray-700'
              : complianceResult.isCompliant
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
          }`}
        >
          {complianceResult.pending
            ? 'PAS ENCORE ANALYSÉ'
            : complianceResult.isCompliant
              ? 'CONFORME'
              : `${criticalCount} CRITIQUE(S)`}
        </span>
      </div>

      <PcbEditorProvider>
        <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4 xl:flex-row">
          {/* Colonne gauche : Layout PCB */}
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-lg border bg-white p-6">
            <h2 className="mb-4 font-semibold text-gray-800">Layout PCB</h2>
            <div className="flex flex-1 items-stretch">
              <PcbCanvas />
            </div>
          </div>

          {/* Colonne droite : panneaux d'analyse (défilement indépendant) */}
          <div className="min-h-0 space-y-4 overflow-y-auto xl:w-[400px] xl:shrink-0">
            {/* C2-bis : conformité remontée en tête de colonne pour rester visible */}
            <div className="overflow-hidden rounded-lg border bg-white">
              <div className="border-b bg-gray-50 p-3 text-sm font-semibold text-gray-700">
                Conformité Physique
              </div>
              <div className="p-4">
                <CompliancePanel projectId={projectId} initialResult={complianceResult} />
              </div>
            </div>

            <RequirementInput projectId={projectId} partFunction={clientRequest?.partFunction} />
            <ProposalsPanel projectId={projectId} proposals={serializedProposals} />
            <PlacementPanel
              projectId={projectId}
              boardWidthMm={boardWidthMm}
              boardHeightMm={boardHeightMm}
            />

            <div className="overflow-hidden rounded-lg border bg-white">
              <div className="border-b bg-gray-50 p-3 text-sm font-semibold text-gray-700">
                Approvisionnement
              </div>
              <div className="p-4">
                <SourcingTable results={sourcingResults} />
              </div>
            </div>

            <PriceCard total={priceTotal} />

            <CapitalizeButton projectId={projectId} />

            <DesignReviewPanel projectId={projectId} />

            <div className="overflow-hidden rounded-lg border bg-white">
              <div className="border-b bg-gray-50 p-3 text-sm font-semibold text-gray-700">
                Fabrication
              </div>
              <div className="p-4">
                <ExportButtons
                  projectId={projectId}
                  components={project.components.map((c) => ({
                    id: c.id,
                    refDes: c.reference,
                    mpn: c.catalogId ?? undefined,
                    description: c.name,
                    footprint: c.footprint ?? undefined,
                  }))}
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border bg-white">
              <div className="border-b bg-gray-50 p-3 text-sm font-semibold text-gray-700">
                Visualisation
              </div>
              <div className="p-4">
                <VisualComparisonOverlay projectId={projectId} layers={comparisonLayers} />
              </div>
            </div>
          </div>
        </div>
      </PcbEditorProvider>
    </div>
  );
}
