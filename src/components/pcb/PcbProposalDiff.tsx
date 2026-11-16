'use client';

import { useState } from 'react';
import type { PcbProposalAction } from '@/lib/pcb/ai-engine';

export function PcbProposalDiff({
  proposals,
  onAccept,
  onReject,
}: {
  proposals: PcbProposalAction[];
  onAccept: (p: PcbProposalAction) => void;
  onReject: (p: PcbProposalAction) => void;
}) {
  const [expanded, setExpanded] = useState<number | null>(0);

  if (proposals.length === 0) {
    return (
      <div className="rounded border bg-gray-50 p-4 text-sm text-gray-500">
        Aucune proposition pour le moment.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {proposals.map((p, i) => (
        <div key={i} className="rounded border bg-white p-3">
          <div
            className="flex cursor-pointer items-center justify-between"
            onClick={() => setExpanded(expanded === i ? null : i)}
          >
            <span className="font-medium">
              {p.action} → {p.target}
            </span>
            <span className="text-xs text-gray-500">{p.reason}</span>
          </div>
          {expanded === i && (
            <pre className="mt-2 overflow-x-auto rounded bg-gray-50 p-2 text-xs">
              {JSON.stringify(p.payload, null, 2)}
            </pre>
          )}
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => onAccept(p)}
              className="rounded bg-green-600 px-3 py-1 text-xs text-white"
            >
              Valider
            </button>
            <button
              type="button"
              onClick={() => onReject(p)}
              className="rounded border px-3 py-1 text-xs"
            >
              Rejeter
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
