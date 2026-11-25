import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/prisma';
import CompliancePanel from '@/components/pcb/CompliancePanel';
import DesignReviewPanel from '@/components/pcb/DesignReviewPanel';
import ExportButtons from '@/components/pcb/ExportButtons';
import VisualComparisonOverlay from '@/components/pcb/VisualComparisonOverlay';
import { WorkspaceBackButton } from './back-button';
import { KicadFileInput } from './kicad-file-input';
import { PcbCanvas } from '@/components/pcb/PcbCanvas';
import { RequirementInput } from './requirement-input';
import { KicadAutoOpen } from './kicad-auto-open';
import { PcbEditorProvider } from '@/components/pcb/PcbEditorProvider';
import { ProposalsPanel } from '@/components/pcb/ProposalsPanel';
import { PlacementPanel } from '@/components/pcb/PlacementPanel';
import { ComponentSourcingPanel } from '@/components/pcb/ComponentSourcingPanel';
import { CapitalizeButton } from '@/components/pcb/CapitalizeButton';
import { computePriceTotal } from '@/lib/pcb/price-total';
import { parseKicadPcb } from '@/lib/pcb/kicad-file-reader';
import fs from 'node:fs';
import path from 'node:path';
import { analyzeRealState } from '@/lib/pcb/simulation';
import { ActionProgressProvider, ActionProgressBar } from '@/components/pcb/ActionProgressProvider';

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
      requirements: true,
    },
  });

  if (!project) {
    return <div className="p-6 text-red-600">Projet introuvable : {projectId}</div>;
  }

  const wizardValidations = await prisma.pcbWizardValidation.findMany({
    where: { projectId },
    select: { step: true },
  });
  const validatedSteps = wizardValidations.map((v) => v.step);

  const clientRequest = project.requestId
    ? await prisma.request.findUnique({
        where: { id: project.requestId },
        select: { partFunction: true },
      })
    : null;

  // C.2 — dimensions du plateau (repli 100 x 80 mm si fichier absent/illisible)
  let boardWidthMm = 100;
  let boardHeightMm = 80;
  const boardStats = { footprints: 0, tracks: 0, zones: 0 };
  let drcViolations = 0;
  if (project.kicadFilePath) {
    try {
      const abs = path.isAbsolute(project.kicadFilePath)
        ? project.kicadFilePath
        : path.join(process.cwd(), project.kicadFilePath);
      const raw = fs.readFileSync(abs, 'utf8');
      const parsed = parseKicadPcb(raw);
      if (parsed.dimensions.width > 0) boardWidthMm = parsed.dimensions.width;
      if (parsed.dimensions.height > 0) boardHeightMm = parsed.dimensions.height;
      boardStats.footprints = parsed.components.length;
      boardStats.tracks = (raw.match(/\(segment\b/g) ?? []).length;
      boardStats.zones = (raw.match(/\(zone\b/g) ?? []).length;
      try {
        const drcRaw = JSON.parse(fs.readFileSync(`${abs}.drc.json`, 'utf8')) as {
          violations?: unknown[];
        };
        drcViolations = Array.isArray(drcRaw.violations) ? drcRaw.violations.length : 0;
      } catch {
        drcViolations = 0;
      }
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

  const complianceResult = await analyzeRealState(
    project.components.map((c) => ({
      id: c.reference,
      footprint: c.footprint ?? undefined,
    })),
    project.nets.map((n) => ({
      name: n.name,
      pins: [],
      vias: [],
    })),
  );

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
          <KicadFileInput
            key={project.kicadFilePath ?? 'no-file'}
            projectId={projectId}
            current={project.kicadFilePath}
          />
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

      <KicadAutoOpen projectId={projectId} kicadFilePath={project.kicadFilePath} />
      <PcbEditorProvider>
        <ActionProgressProvider>
          <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4 xl:flex-row">
            {/* Colonne gauche : Layout PCB */}
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-lg border bg-white p-6">
              <ActionProgressBar />
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-gray-800">Layout PCB</h2>
                <span className="text-sm font-semibold text-gray-700">
                  {priceTotal.lineCount === 0
                    ? 'Coût : —'
                    : `Coût estimé : ${(priceTotal.currency === 'EUR'
                        ? priceTotal.total * 3.3
                        : priceTotal.total
                      ).toFixed(2)} ${priceTotal.currency === 'EUR' ? 'DT' : priceTotal.currency}`}
                </span>
              </div>
              <div className="flex flex-1 items-stretch">
                <PcbCanvas
                  projectId={projectId}
                  wizard={{
                    projectId,
                    cdcValidated:
                      project.status === 'requirements_validated' ||
                      project.requirements.length > 0,
                    kicadFilePath: project.kicadFilePath,
                    persistedComponents: project.components.length,
                    proposedComponents:
                      (project.sourcingCache as { components?: unknown[] } | null)?.components
                        ?.length ?? 0,
                    requirementsCount: project.requirements.length,
                    netsCount: project.nets.length,
                    footprints: boardStats.footprints,
                    tracks: boardStats.tracks,
                    zones: boardStats.zones,
                    compliant: complianceResult.isCompliant,
                    heuristicNets: project.nets.filter((n) => n.source === 'heuristic').length,
                    componentsCount: project.components.length,
                    validatedSteps,
                    drcViolations,
                  }}
                />
              </div>
            </div>

            {/* Colonne droite : panneaux d'analyse (défilement indépendant) */}
            <div className="min-h-0 space-y-4 overflow-y-auto xl:w-[400px] xl:shrink-0">
              {/* Ordre = démarche de conception : CDC -> propositions -> sourcing
                (nets/placement/routage) -> placement manuel -> revue -> contrôles
                -> visualisation -> fabrication -> audit magasin (tâche support). */}

              {/* Étape 1 — Cahier des charges */}
              <div id="card-cdc">
                <RequirementInput
                  projectId={projectId}
                  partFunction={clientRequest?.partFunction}
                  kicadFilePath={project.kicadFilePath}
                />
              </div>

              {/* Étape 2 — Propositions IA à examiner */}
              <div id="card-proposals">
                <ProposalsPanel projectId={projectId} proposals={serializedProposals} />
              </div>

              {/* Étape 3 — Sourcing : netlist, placement optimisé, routage */}
              <div id="card-sourcing">
                <ComponentSourcingPanel projectId={projectId} />
              </div>

              {/* Étape 4 — Placement manuel / ajustements */}
              <div id="card-placement">
                <PlacementPanel
                  projectId={projectId}
                  boardWidthMm={boardWidthMm}
                  boardHeightMm={boardHeightMm}
                />
              </div>

              {/* Étape 5 — Revue de conception */}
              <div id="card-review">
                <DesignReviewPanel projectId={projectId} />
              </div>

              <CapitalizeButton projectId={projectId} />

              {/* Étape 6 — Conformité physique */}
              <div className="overflow-hidden rounded-lg border bg-white">
                <div className="border-b bg-gray-50 p-3 text-sm font-semibold text-gray-700">
                  Conformité Physique
                </div>
                <div className="p-4">
                  <CompliancePanel projectId={projectId} initialResult={complianceResult} />
                </div>
              </div>

              {/* Étape 7 — Visualisation */}
              <div className="overflow-hidden rounded-lg border bg-white">
                <div className="border-b bg-gray-50 p-3 text-sm font-semibold text-gray-700">
                  Visualisation
                </div>
                <div className="p-4">
                  <VisualComparisonOverlay projectId={projectId} layers={comparisonLayers} />
                </div>
              </div>

              {/* Étape 8 — Fabrication */}
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

              {/* Tâche support — Audit du magasin */}
              <div className="overflow-hidden rounded-lg border bg-white">
                <div className="border-b bg-gray-50 p-3 text-sm font-semibold text-gray-700">
                  Approvisionnement
                </div>
                <div className="p-4">
                  <Link href={`/admin/pcb/${projectId}/magasin`}>
                    <Button variant="outline" size="sm" className="w-full">
                      Ouvrir l&apos;audit complet du magasin
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </ActionProgressProvider>
      </PcbEditorProvider>
    </div>
  );
}
