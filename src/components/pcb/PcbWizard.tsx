'use client';

import { useState } from 'react';

interface Props {
  requirementsCount: number;
  netsCount: number;
  footprints: number;
  tracks: number;
  zones: number;
  compliant: boolean;
}

interface Step {
  label: string;
  hint: string;
  target: string;
  done: boolean;
}

export function PcbWizard({
  requirementsCount,
  netsCount,
  footprints,
  tracks,
  zones,
  compliant,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);

  const steps: Step[] = [
    {
      label: 'Cahier des charges',
      hint: 'Analyser le cahier des charges',
      target: 'card-cdc',
      done: requirementsCount > 0,
    },
    {
      label: 'Netlist',
      hint: 'Générer puis corriger les connexions',
      target: 'card-sourcing',
      done: netsCount > 0,
    },
    {
      label: 'Placement',
      hint: 'Tout placer (optimisé) dans le plateau',
      target: 'card-sourcing',
      done: footprints > 0,
    },
    {
      label: 'Routage',
      hint: 'Router la carte (pistes + zone GND)',
      target: 'card-sourcing',
      done: tracks > 0 && zones > 0,
    },
    {
      label: 'Vérifications',
      hint: 'Revue, conformité puis fabrication',
      target: 'card-review',
      done: compliant,
    },
  ];

  const currentIndex = steps.findIndex((s) => !s.done);
  const current: Step =
    (currentIndex >= 0 ? steps[currentIndex] : steps[steps.length - 1]) ?? steps[0]!;
  const doneCount = steps.filter((s) => s.done).length;

  const goTo = (target: string) => {
    const el = document.getElementById(target);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.classList.add('ring-2', 'ring-blue-400');
    window.setTimeout(() => el.classList.remove('ring-2', 'ring-blue-400'), 1600);
  };

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="sticky top-0 z-10 w-full rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-left text-xs font-semibold text-blue-800 shadow-sm"
      >
        Assistant PCB — étape {Math.min(doneCount + 1, steps.length)}/{steps.length} :{' '}
        {current.label} ▾
      </button>
    );
  }

  return (
    <section className="sticky top-0 z-10 rounded-lg border border-blue-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold text-gray-800">
          Assistant de conception · {doneCount}/{steps.length} étapes
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
      <ol className="flex items-center gap-1">
        {steps.map((step, index) => (
          <li key={step.label} className="flex min-w-0 flex-1 items-center gap-1">
            <button
              type="button"
              onClick={() => goTo(step.target)}
              title={`${step.label} — ${step.hint}`}
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                step.done
                  ? 'bg-green-600 text-white'
                  : index === currentIndex
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step.done ? '✓' : index + 1}
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
        ))}
      </ol>
      <div className="mt-2 flex items-center justify-between gap-2 rounded bg-blue-50 px-2 py-1.5">
        <p className="truncate text-[11px] text-blue-900">
          <span className="font-semibold">À faire :</span> {current.hint}
        </p>
        <button
          type="button"
          onClick={() => goTo(current.target)}
          className="shrink-0 rounded bg-blue-600 px-2 py-0.5 text-[11px] font-semibold text-white"
        >
          Y aller →
        </button>
      </div>
    </section>
  );
}
