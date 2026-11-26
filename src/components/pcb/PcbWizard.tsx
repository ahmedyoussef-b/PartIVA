'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { repairKicadSync } from '@/lib/pcb/client/kicad-file';
import { usePcbLiveState } from './PcbLiveStateProvider';

interface Props {
  projectId: string;
}

interface FileStatus {
  inDb: boolean;
  onDisk: boolean;
  needsRepair: boolean;
  path: string | null;
  suggestedPath: string | null;
}

interface Step {
  id: string;
  label: string;
  hint: string;
  target: string;
  done: boolean;
  prerequisite: boolean;
  blockedMessage: string;
}

export function PcbWizard({ projectId }: Props) {
  const router = useRouter();
  const { state } = usePcbLiveState();
  const [collapsed, setCollapsed] = useState(false);
  const [validating, setValidating] = useState(false);

  // État serveur frais (polling 3 s) : le wizard avance dès que la BDD/le plateau change.
  const {
    cdcValidated,
    nextActionId,
    kicadFilePath,
    requirementsCount,
    netsCount,
    heuristicNets,
    componentsCount,
    footprints,
    tracks,
    zones,
    compliant,
    validatedSteps,
    drcViolations,
  } = state;

  const fileStatus: FileStatus = {
    inDb: !!kicadFilePath,
    onDisk: state.onDisk,
    needsRepair: state.needsRepair,
    path: kicadFilePath,
    suggestedPath: state.suggestedPath,
  };

  // Vérification ponctuelle (création/réparation) ; le suivi continu est dans le provider.
  const checkFile = async (): Promise<FileStatus | null> => {
    try {
      const res = await fetch(`/api/pcb/projects/${projectId}/board/status`);
      if (!res.ok) return null;
      return (await res.json()) as FileStatus;
    } catch {
      return null;
    }
  };

  const steps: Step[] = [
    {
      id: 'analyze',
      label: 'CDC',
      hint: 'Analyser le cahier des charges',
      target: 'card-cdc',
      done: cdcValidated,
      prerequisite: true,
      blockedMessage: '',
    },
    {
      id: 'nets',
      label: 'Netlist',
      hint: 'Générer puis vérifier les connexions',
      target: 'card-sourcing',
      done: netsCount > 0,
      prerequisite: requirementsCount > 0,
      blockedMessage: "Générez d'abord le cahier des charges avant les nets.",
    },
    {
      id: 'placement',
      label: 'Placement',
      hint: 'Optimiser la répartition des composants sur le plateau',
      target: 'card-placement',
      done: footprints > 0,
      prerequisite: netsCount > 0,
      blockedMessage: "Générez d'abord les connexions avant de placer.",
    },
    {
      id: 'routing',
      label: 'Routage',
      hint: 'Router la carte (pistes + zone GND)',
      target: 'card-sourcing',
      done: tracks > 0 || zones > 0,
      prerequisite: footprints > 0,
      blockedMessage: "Placez d'abord les composants avant de router.",
    },
    {
      id: 'review',
      label: 'Vérifications',
      hint: 'Revue, conformité puis fabrication',
      target: 'card-review',
      done: compliant,
      prerequisite: tracks > 0,
      blockedMessage: "Routez d'abord la carte avant la revue finale.",
    },
  ];

  const currentIndex = steps.findIndex((s) => !s.done);
  const current: Step = steps[currentIndex >= 0 ? currentIndex : steps.length - 1]!;
  const validatedCount = steps.filter((s) => validatedSteps.includes(s.id)).length;
  const canValidate = current.done && !validatedSteps.includes(current.id);

  // Le wizard GUIDE : il ne déclenche jamais l'action. Il nomme le bouton exact
  // à actionner (libellés alignés sur ComponentSourcingPanel) et le panneau de
  // droite le met en évidence via `nextActionId`.
  const nextGuidance: Record<string, { label: string; button: string; where: string }> = {
    analyze: {
      label: 'Analyser le cahier des charges',
      button: 'Analyser',
      where: 'dans la page Cahier des charges',
    },
    components: {
      label: 'Générer les composants',
      button: '1. Générer les composants (LLM)',
      where: 'dans le panneau Sourcing (droite)',
    },
    nets: {
      label: 'Générer les nets',
      button: '2. Générer les nets (GND/VCC)',
      where: 'dans le panneau Sourcing (droite)',
    },
    'edit-netlist': {
      label: 'Corriger la netlist',
      button: '3. Éditer la Netlist',
      where: 'dans le panneau Sourcing (droite)',
    },
    place: {
      label: 'Optimiser la répartition',
      button: '4. Optimiser la répartition',
      where: 'dans le panneau Sourcing (droite)',
    },
    route: {
      label: 'Router la carte',
      button: '5. Router la carte',
      where: 'dans le panneau Sourcing (droite)',
    },
    review: {
      label: 'Vérifier la conformité',
      button: 'Revue / Conformité',
      where: 'dans le panneau de droite',
    },
  };
  const nextAction = nextGuidance[nextActionId] ?? {
    label: 'Étape suivante',
    button: '…',
    where: 'dans le panneau de droite',
  };

  // Navigation uniquement : on amène l'utilisateur à la carte Concernée,
  // sans exécuter l'action à sa place.
  const goTo = (step: Step) => {
    if (!step.prerequisite) {
      toast.error(step.blockedMessage, { duration: 8000 });
      return;
    }
    const el = document.getElementById(step.target);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.classList.add('ring-2', 'ring-blue-400');
    window.setTimeout(() => el.classList.remove('ring-2', 'ring-blue-400'), 1600);
  };

  const validate = async () => {
    setValidating(true);
    try {
      const res = await fetch('/api/pcb/wizard/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: window.location.pathname.split('/')[3],
          step: current.id,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || `Erreur ${res.status}`);
      toast.success(`Étape « ${current.label} » validée`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Validation impossible');
    } finally {
      setValidating(false);
    }
  };

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="sticky top-0 z-10 w-full rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-left text-xs font-semibold text-blue-800 shadow-sm"
      >
        Assistant PCB — {validatedCount}/{steps.length} étapes validées · {current.label} ▾
      </button>
    );
  }

  return (
    <section className="rounded-lg border border-blue-200 bg-white p-3 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-xs font-semibold text-gray-800">
          Assistant de conception · {validatedCount}/{steps.length} étapes validées
        </h2>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="text-xs text-gray-400 hover:text-gray-700"
          title="Réduire l'assistant"
        >
          ▴
        </button>
      </div>
      <div className="mb-2 h-1.5 w-full overflow-hidden rounded bg-gray-200">
        <div
          className="h-full rounded bg-green-500 transition-all"
          style={{ width: `${(validatedCount / steps.length) * 100}%` }}
        />
      </div>
      <ol className="flex items-center gap-1">
        {steps.map((step, index) => {
          const validated = validatedSteps.includes(step.id);
          return (
            <li key={step.id} className="flex min-w-0 flex-1 items-center gap-1">
              <button
                type="button"
                onClick={() => goTo(step)}
                title={`${step.label} — ${step.hint}${step.prerequisite ? '' : ` — ${step.blockedMessage}`}`}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  validated
                    ? 'bg-green-600 text-white'
                    : step.done
                      ? 'bg-amber-400 text-white'
                      : index === currentIndex
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                }`}
              >
                {validated ? '✓' : step.done ? '◉' : index + 1}
              </button>
              <span
                className={`hidden truncate text-[10px] lg:inline ${
                  index === currentIndex ? 'font-semibold text-blue-700' : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>
              {index < steps.length - 1 && <span className="h-px flex-1 bg-gray-200" />}
            </li>
          );
        })}
      </ol>

      {fileStatus?.needsRepair && (
        <div className="mt-2 rounded border border-orange-200 bg-orange-50 p-2 text-[11px] text-orange-900">
          Fichier KiCad présent sur le disque mais absent de la base.
          <button
            type="button"
            className="ml-2 rounded bg-orange-600 px-2 py-0.5 text-[10px] font-semibold text-white"
            onClick={async () => {
              try {
                await repairKicadSync(projectId, fileStatus.suggestedPath!);
                await checkFile();
                router.refresh();
                toast.success('Synchronisation réparée');
              } catch (e) {
                toast.error(e instanceof Error ? e.message : 'Réparation impossible');
              }
            }}
          >
            Réparer la synchronisation
          </button>
        </div>
      )}

      {heuristicNets > 0 && (
        <div className="mt-2 rounded border border-blue-200 bg-blue-50 p-2 text-[11px] text-blue-900">
          {heuristicNets} net(s) inféré(s) automatiquement. Vérifiez-les avec le bouton « 3. Éditer
          la Netlist » du panneau Sourcing avant de continuer.
        </div>
      )}

      <div className="mt-2 rounded border border-blue-300 bg-blue-50 px-2 py-1.5">
        <p className="text-[11px] text-blue-900">
          <span className="font-semibold">À faire :</span> {nextAction.label}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-1 text-[11px] font-semibold text-blue-800">
          <span className="animate-pulse text-sm">→</span>
          Cliquez sur{' '}
          <span className="rounded bg-blue-700 px-1.5 py-0.5 text-[10px] text-white">
            {nextAction.button}
          </span>{' '}
          {nextAction.where} — ce bouton est surligné en bleu.
        </p>
        {canValidate && (
          <button
            type="button"
            onClick={validate}
            disabled={validating}
            className="mt-1.5 rounded bg-green-600 px-2 py-0.5 text-[11px] font-semibold text-white"
          >
            {validating ? '…' : 'Valider cette étape'}
          </button>
        )}
      </div>

      {tracks > 0 && (
        <div className="mt-2 rounded border border-gray-200 bg-gray-50 p-2 text-[11px]">
          <p className="font-semibold text-gray-800">Récapitulatif routage</p>
          <p className="text-gray-600">
            {tracks} pistes · {drcViolations} violations DRC · {componentsCount} composants
          </p>
          <p className="mt-1 text-[10px] text-gray-600">
            Pour un routage complet, actionnez « 6. Routage complet (Freerouting) » dans le panneau
            Sourcing. Export fabrication : Phase 5.
          </p>
        </div>
      )}
    </section>
  );
}
