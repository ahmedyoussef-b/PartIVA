'use client';

import type { RequirementAnswer } from '@/lib/pcb/types';

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmé',
  proposed: "Proposé par l'IA",
  to_verify: 'À vérifier',
  missing: 'Manquant',
};

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-800',
  proposed: 'bg-blue-100 text-blue-800',
  to_verify: 'bg-amber-100 text-amber-800',
  missing: 'bg-red-100 text-red-800',
};

export function RequirementSummary({ answers }: { answers: RequirementAnswer[] }) {
  return (
    <div className="mt-6 rounded border bg-white p-4">
      <h3 className="mb-3 text-lg font-semibold">Récapitulatif des exigences</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="p-2">Bloc</th>
            <th className="p-2">Question</th>
            <th className="p-2">Réponse</th>
            <th className="p-2">Statut</th>
          </tr>
        </thead>
        <tbody>
          {answers.map((a, i) => (
            <tr key={i} className="border-b">
              <td className="p-2">{a.blockId}</td>
              <td className="p-2">{a.questionId}</td>
              <td className="p-2">{a.answer}</td>
              <td className="p-2">
                <span className={`rounded px-2 py-1 text-xs ${STATUS_COLORS[a.status] ?? ''}`}>
                  {STATUS_LABELS[a.status] ?? a.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
