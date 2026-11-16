'use client';

import { useState } from 'react';
import { PcbProposalDiff } from './PcbProposalDiff';
import { PcbRollbackDialog } from './PcbRollbackDialog';
import { PcbPriceCounter } from './PcbPriceCounter';
import type { PcbProposalAction } from '@/lib/pcb/ai-engine';

interface ProjectData {
  id: string;
  name: string;
  status: string;
  components: Array<{ id: string; name: string; catalogId?: string; status: string }>;
  proposals: Array<{
    id: string;
    action: string;
    target: string;
    payload: unknown;
    reason?: string;
    status: string;
  }>;
  checkpoints: Array<{ id: string; label: string; createdAt: string }>;
}

export function PcbProjectWorkspace({ project }: { project: ProjectData }) {
  const [proposals, setProposals] = useState<PcbProposalAction[]>(
    project.proposals
      .filter((p) => p.status === 'pending')
      .map((p) => ({
        action: p.action as PcbProposalAction['action'],
        target: p.target,
        payload: p.payload as Record<string, unknown>,
        reason: p.reason ?? '',
        requires_validation: true,
      })),
  );
  const [rollbackTarget, setRollbackTarget] = useState<{ id: string; label: string } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const totalPrice = project.components.length * 1.5; // placeholder — à remplacer par le prix réel

  function handleAccept(proposal: PcbProposalAction) {
    setProposals((prev) => prev.filter((p) => p !== proposal));
    setMessage(`Proposition acceptée : ${proposal.action} → ${proposal.target}`);
  }

  function handleReject(proposal: PcbProposalAction) {
    setProposals((prev) => prev.filter((p) => p !== proposal));
    setMessage(`Proposition rejetée : ${proposal.action} → ${proposal.target}`);
  }

  async function createCheckpoint() {
    const res = await fetch('/api/pcb/checkpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: project.id,
        label: `Checkpoint ${new Date().toISOString()}`,
      }),
    });
    if (res.ok) {
      setMessage('Checkpoint créé');
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-sm text-gray-500">Statut : {project.status}</p>
        </div>
        <PcbPriceCounter total={totalPrice} count={project.components.length} />
      </header>

      {message && (
        <div className="mb-4 rounded border border-green-300 bg-green-50 p-2 text-sm text-green-800">
          {message}
        </div>
      )}

      <section className="mb-6">
        <h2 className="mb-2 text-lg font-semibold">Propositions IA</h2>
        <PcbProposalDiff proposals={proposals} onAccept={handleAccept} onReject={handleReject} />
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-lg font-semibold">Checkpoints</h2>
        <button
          type="button"
          onClick={createCheckpoint}
          className="mb-2 rounded bg-blue-600 px-3 py-1 text-sm text-white"
        >
          Créer un checkpoint
        </button>
        <ul className="space-y-1">
          {project.checkpoints.map((cp) => (
            <li
              key={cp.id}
              className="flex items-center justify-between rounded border bg-white p-2 text-sm"
            >
              <span>
                {cp.label} — {new Date(cp.createdAt).toLocaleString()}
              </span>
              <button
                type="button"
                onClick={() => setRollbackTarget({ id: cp.id, label: cp.label })}
                className="rounded border px-2 py-1 text-xs"
              >
                Rollback
              </button>
            </li>
          ))}
        </ul>
      </section>

      {rollbackTarget && (
        <PcbRollbackDialog
          checkpointId={rollbackTarget.id}
          checkpointLabel={rollbackTarget.label}
          onConfirm={() => {
            setRollbackTarget(null);
            setMessage(`Rollback effectué vers ${rollbackTarget.label}`);
          }}
          onCancel={() => setRollbackTarget(null)}
        />
      )}
    </div>
  );
}
