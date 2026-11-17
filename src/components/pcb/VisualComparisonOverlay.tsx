'use client';

import { useState } from 'react';

type ComparisonMode = 'original' | 'reviewed' | 'sourced' | 'exported';

interface VisualComparisonOverlayProps {
  projectId: string;
}

const MODE_CONFIG: Record<
  ComparisonMode,
  { label: string; color: string; borderColor: string; bgHover: string }
> = {
  original: {
    label: 'Original',
    color: '#3B82F6',
    borderColor: 'border-blue-500',
    bgHover: 'hover:bg-blue-50',
  },
  reviewed: {
    label: 'Après Revue',
    color: '#10B981',
    borderColor: 'border-green-500',
    bgHover: 'hover:bg-green-50',
  },
  sourced: {
    label: 'Après Sourcing',
    color: '#F59E0B',
    borderColor: 'border-amber-500',
    bgHover: 'hover:bg-amber-50',
  },
  exported: {
    label: 'Prêt Export',
    color: '#8B5CF6',
    borderColor: 'border-violet-500',
    bgHover: 'hover:bg-violet-50',
  },
};

export default function VisualComparisonOverlay({ projectId }: VisualComparisonOverlayProps) {
  void projectId; // Lint fix (A4)

  const [activeModes, setActiveModes] = useState<Set<ComparisonMode>>(new Set(['original']));
  const [opacity, setOpacity] = useState(0.7);

  const toggleMode = (mode: ComparisonMode) => {
    setActiveModes((prev) => {
      const next = new Set(prev);
      if (next.has(mode)) next.delete(mode);
      else next.add(mode);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-800">Comparaison Visuelle</h3>

      {/* Contrôles */}
      <div className="grid grid-cols-2 gap-2">
        {(Object.entries(MODE_CONFIG) as [ComparisonMode, typeof MODE_CONFIG.original][]).map(
          ([mode, config]) => {
            const isActive = activeModes.has(mode);
            return (
              <button
                key={mode}
                onClick={() => toggleMode(mode)}
                className={`rounded border-2 px-3 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? `${config.borderColor} ${config.bgHover} text-gray-900`
                    : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'
                }`}
                style={{
                  borderLeftWidth: isActive ? '4px' : '2px',
                  borderLeftColor: isActive ? config.color : undefined,
                }}
              >
                <span
                  className="mr-1.5 inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
                {config.label}
              </button>
            );
          },
        )}
      </div>

      {/* Curseur opacité */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-gray-500">Opacité:</span>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.1"
          value={opacity}
          onChange={(e) => setOpacity(parseFloat(e.target.value))}
          className="h-1 flex-1 cursor-pointer appearance-none rounded-lg bg-gray-200 accent-indigo-600"
        />
        <span className="w-8 text-[10px] text-gray-500">{Math.round(opacity * 100)}%</span>
      </div>

      {/* Zone de visualisation (placeholder) */}
      <div className="relative flex min-h-[200px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <p className="mb-2 text-sm text-gray-500">Zone de superposition visuelle</p>
        <p className="text-[10px] text-gray-400">
          {activeModes.size === 0
            ? 'Sélectionnez au moins un mode'
            : `${activeModes.size} couche(s) active(s)`}
        </p>

        {/* Indicateurs visuels des couches actives */}
        <div className="mt-4 flex gap-2">
          {[...activeModes].map((mode) => (
            <div
              key={mode}
              className="flex h-8 w-8 items-center justify-center rounded text-[10px] font-bold text-white shadow-sm"
              style={{ backgroundColor: MODE_CONFIG[mode].color, opacity }}
            >
              {MODE_CONFIG[mode].label[0]}
            </div>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-gray-400 italic">
        Bleu = Original • Vert = Après revue • Ambre = Après sourcing • Violet = Prêt export
      </p>
    </div>
  );
}
